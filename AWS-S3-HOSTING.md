# AWS S3 hosting — step-by-step (Hinglish)

Is project ko run karne ke liye S3 par Node.js server ki zaroorat nahi hai. Next.js build HTML, CSS aur JavaScript files generate karta hai.

## 1. Pehle apna portfolio build karein

`data/portfolio.ts` mein apni details add karein, sample projects aur about/skills content ko real details se replace karein. Phir:

```powershell
npm install
npm run build
npm run preview
```

Browser mein http://localhost:3000 khol kar site check karein. `out/` mein `index.html`, `404.html`, `_next/` aur assets milenge. **out ke andar ki sab files/folders upload karni hain; out folder ko bucket ke andar nest nahi karna.**

## 2. Simple option: S3 website endpoint (HTTP)

Ye option public portfolio ke liye seedha setup hai. S3 website endpoint HTTPS support nahi karta. HTTPS chahiye toh section 3 follow karein.

1. AWS Console → S3 → **Create bucket**. General purpose bucket choose karein, globally unique name dein, jaise `your-name-portfolio-2026`, aur apna region choose karein. Default ACLs disabled rehne dein.
2. Bucket → **Objects → Upload**. `out/` ke andar ki saari files aur folders upload karein. `_next/` folder skip na karein.
3. **Properties → Static website hosting → Edit**. Enable → Host a static website. Index document: `index.html`. Error document: `404.html`. Save.
4. Is dedicated public-website bucket ke **Permissions → Block public access → Edit** mein public bucket policies ko allow karein (console tutorial mein Block all public access off karke save hota hai). Account/organization public-access restrictions bhi apply ho sakti hain. Kisi unrelated ya private-data bucket ki permissions change na karein.
5. **Permissions → Bucket policy → Edit** mein neeche ki policy paste karein. Dono jagah ke placeholder instructions follow karte hue `YOUR_BUCKET_NAME` ko apne actual bucket name se replace karein. Ye policy sirf object read allow karti hai, upload/delete nahi.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadPortfolio",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

6. **Properties → Static website hosting → Bucket website endpoint** copy karke browser mein open karein. Console se exact endpoint copy karein; region ke hisaab se hostname vary karta hai.

Is method mein uploaded objects publicly readable hain. Sirf `out/` deploy karein, `.env`, AWS keys ya source repository nahi.

## 3. Recommended: private S3 + CloudFront (HTTPS)

Is option mein S3 bucket private rahega aur users CloudFront ke HTTPS URL se website dekhenge.

1. General purpose S3 bucket create karein. **Block all public access ON** rakhein. `out/` ke contents upload karein. S3 static website hosting enable karna zaroori nahi hai.
2. CloudFront → Create distribution. Origin mein S3 bucket ka **regular REST origin** choose karein, website endpoint nahi. Origin path empty rakhein.
3. **Origin access control (OAC)** create/select karein; sign requests select karein. CloudFront jo bucket policy provide kare, woh S3 bucket permissions mein apply karein. Policy distribution-specific hoti hai: ise generic public-read policy se replace na karein.
4. Viewer protocol policy: **Redirect HTTP to HTTPS**. Allowed methods: GET, HEAD. Compression enable karein. Static assets ke liye managed caching policy use kar sakte hain.
5. Default root object: **index.html** (starting slash nahi). Distribution create/deploy hone dein.
6. Custom error responses add karein: origin 403 aur 404 ko `/404.html`, HTTP response code **404**, aur low error caching TTL (e.g. 10 seconds) par map karein. Isse missing pages sahi error status ke saath dikhenge. `/index.html` + 200 fallback ki zaroorat nahi hai: ye single-page anchor portfolio hai.
7. Distribution ka `https://…cloudfront.net` URL test karein. Homepage, navigation, CSS/JS aur mobile layout verify karein.

**Important:** OAC regular S3 origin ke saath kaam karta hai; S3 website endpoint ke saath nahi. Is portfolio ke Work/About/Skills/Contact sections `#` anchors hain, isliye additional routing configuration nahi chahiye. Future mein `/about/` jaise separate routes add karein toh CloudFront Function se directory requests ko `/about/index.html` rewrite karna padega (ya equivalent explicit object routing), kyunki private S3 origin directory index automatically resolve nahi karta.

### Optional custom domain

1. ACM mein certificate request karein in **US East (N. Virginia), us-east-1** for CloudFront. DNS validation complete karein.
2. CloudFront distribution mein alternate domain name (e.g. `portfolio.yourdomain.com`) aur certificate attach karein.
3. DNS provider mein domain ko CloudFront distribution par point karein. Route 53 mein Alias A record use kar sakte hain; IPv6 enabled ho toh matching AAAA alias bhi add karein. Subdomain ke liye other providers par CNAME use karein. Apex/root domain par provider-specific ALIAS/ANAME support check karein.

## 4. Future updates AWS CLI se

AWS CLI install/configure karein using a suitable IAM identity, ideally SSO (`aws configure sso`, then `aws sso login`). AWS credentials kabhi app source mein add na karein. Bucket upload/read/list permissions aur optional CloudFront invalidation permission chahiye.

PowerShell mein:

```powershell
npm run build
aws s3 sync ./out s3://YOUR_BUCKET_NAME --exclude "_next/*" --cache-control "public,max-age=0,must-revalidate"
aws s3 sync ./out/_next s3://YOUR_BUCKET_NAME/_next --cache-control "public,max-age=31536000,immutable"
```

CloudFront use kar rahe hain toh deploy ke baad:

```powershell
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

Commands ko apne bucket/distribution IDs ke saath chalayein. `--delete` intentionally use nahi kiya gaya, taki existing unrelated objects accidentally delete na hon. Purane hashed assets reh sakte hain; cleanup sirf dedicated bucket aur verified obsolete files par karein. CloudFront caching policy ki minimum TTL HTML cache headers par precedence le sakti hai; deployment invalidation fresh HTML ko serve karne mein madad karta hai.

## Troubleshooting

| Problem | Kya check karein |
| --- | --- |
| 403 Access Denied (public website) | Bucket/account public access settings, `s3:GetObject` bucket policy, exact bucket ARN, and `index.html` at root. |
| 403 with CloudFront | OAC attached, signed requests enabled, correct distribution ARN in bucket policy, REST origin selected. |
| Blank/unstyled page | `_next/` upload hua hai? Files root mein hain? Browser Network tab mein missing assets check karein. |
| XML listing/error | Public option mein S3 website endpoint kholen; private option mein CloudFront URL kholen. |
| HTTPS unavailable | S3 website URL HTTP-only hai. CloudFront use karein. |
| Old version visible | Rebuild, re-upload, invalidate CloudFront, and refresh browser. |
| Contact does nothing | Apna email configure karein and device par mail app configure ho. No email-submission backend is included. |

AWS S3 storage/requests, CloudFront delivery, domain aur invalidations ke charges usage aur plan par depend karte hain. AWS Billing mein apna budget alert set kar sakte hain; is guide mein free hosting ki guarantee nahi hai.

## Official references

- [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports)
- [S3 website setup](https://docs.aws.amazon.com/AmazonS3/latest/userguide/HostingWebsiteOnS3Setup.html)
- [S3 public website permissions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteAccessPermissionsReqd.html)
- [CloudFront Origin Access Control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [CloudFront HTTPS certificate requirements](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html)
