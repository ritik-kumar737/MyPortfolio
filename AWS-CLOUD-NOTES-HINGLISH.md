# AWS web hosting — complete Hinglish learning notes

**For:** Ritik Kumar · **Updated:** 27 September 2026

Ye notes concepts samajhne aur revise karne ke liye hain. Example domain `ritikdevops.site` aur example distribution `da8evm3o45s8s.cloudfront.net` hai. Console labels aur pricing badal sakte hain; pricing links neeche diye hain. Tumhare account ka exact billing plan, permissions aur DNS configuration in notes ke liye inspect nahi kiya gaya hai.

## 1. Sabse pehle: kaun kya karta hai?

Ek library ka example socho:

| Component | Simple meaning | Website mein actual kaam |
| --- | --- | --- |
| Domain | Library ka yaad rehne wala naam | `ritikdevops.site` |
| GoDaddy, as registrar | Naam register/renew karne wali company | Domain registration aur nameserver delegation manage karna |
| Route 53 | Address directory | Domain ke DNS queries ka authoritative answer dena |
| S3 | Original books ka store | HTML, CSS, JS, photos, PDFs jaise objects rakhna |
| CloudFront | Readers ke paas delivery branches | Edge locations se content deliver/cache karna |
| ACM | Certificate manager | TLS certificate request, validation, deployment integration aur renewal |
| TLS | Protected communication | Browser aur endpoint ke connection ki encryption, integrity aur authentication |

**Registration, DNS, hosting, delivery aur encryption alag responsibilities hain. Ek provider kuch ya sab responsibilities de sakta hai.**

Do flows alag samjho:

```text
DNS lookup — address pata karna:
Browser/OS → recursive DNS resolver
             → zaroorat par Root → .site TLD → Route 53 authoritative DNS
             ← CloudFront ke liye suitable IP address(es)

Website delivery — actual files mangwana:
Browser ── HTTPS/TLS ──> CloudFront edge
                         ├─ Cache hit: saved response return
                         └─ Cache miss: origin S3 se file lo, phir return karo

GoDaddy: registrar par Route 53 nameservers ki delegation configured hai.
ACM: CloudFront ke saath use hone wala custom-domain certificate manage karta hai.
```

Har visit par root/TLD lookup repeat nahi hota: DNS answers cache ho sakte hain. Website ki HTML file Route 53 ya GoDaddy se hokar pass nahi hoti. [DNS request flow](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/welcome-dns-service.html)

## 2. Amazon S3 kya hai?

**S3 = Simple Storage Service. Ye object storage hai.** Tum bytes/files upload karte ho; S3 unhe store karta hai aur permission ke hisaab se retrieve karne deta hai.

Iska use websites ke static assets, application uploads, backups, logs, datasets, media aur archives ke liye hota hai. Server ki disk manually manage kiye bina storage use kar sakte ho. [S3 overview](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)

### Bucket, object, key aur metadata

| Term | Meaning | Example |
| --- | --- | --- |
| Bucket | Objects ka container | `my-portfolio-bucket` |
| Object | File content aur usse related information | `index.html` ka content |
| Key | Bucket ke andar object ka identifier | `images/profile.jpg` |
| Metadata | Object ko describe karne wali information | `Content-Type: image/jpeg` |
| Region | Bucket ka AWS location | Mumbai: `ap-south-1` |

General-purpose S3 bucket mein console ke folders mostly key prefixes hain. `images/profile.jpg` mein `images/` prefix hai; normal filesystem ki directory jaisa assume mat karo. S3 ko EC2 ki attached hard disk bhi mat samjho. [S3 objects](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingObjects.html)

### S3 ki zaroorat kyun padti hai?

Jab application ko durable files rakhni hain, unhe retrieve/share karna hai, ya compute server se storage alag rakhna hai, tab S3 useful hai. Versioning old object versions preserve kar sakti hai; lifecycle rules old data transition/expire kar sakte hain. Permissions se public/private access decide hota hai. Ye features configure karne padte hain; har backup policy automatically nahi ban jaati. [S3 features](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)

### S3 kya nahi karta?

Static website hosting mein S3 HTML/CSS/JS files serve karta hai. Ye tumhara Node.js, Nginx, Apache, PHP ya database process run nahi karta. Browser JavaScript run kar sakta hai, lekin server-side application ke liye alag compute/backend chahiye.

Isliye Next.js ka **static export** S3 par chal sakta hai; server-side rendering/API-dependent Next.js app sirf files upload karne se nahi chalega. [S3 static hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)

### S3 mein file upload kaise hoti hai?

Console: S3 → bucket → Objects → Upload → files/folders select → Upload.

AWS CLI se, configured IAM identity/SSO permissions ke saath:

```powershell
# Ek file upload; YOUR_BUCKET_NAME ko replace karo.
aws s3 cp ./index.html s3://YOUR_BUCKET_NAME/index.html

# Local folder ki new/changed files upload.
aws s3 sync ./out s3://YOUR_BUCKET_NAME
```

Console, CLI aur SDK S3 API requests banate hain. S3 identity/permissions check karke object save karta hai. `PutObject` upload aur `GetObject` retrieval ka common operation hai. Large uploads ke liye multipart upload file ko parts mein transfer kar sakta hai. SDK se application bhi upload kar sakti hai; presigned URL limited-time permission de sakta hai. AWS secret keys frontend mein mat rakho. [Upload methods](https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html)

Website deploy karte waqt `out` ke contents bucket root mein upload karo. Agar `out/index.html` key upload ki, toh root par `index.html` nahi milega. Same key par upload object ko replace karta hai; versioning enabled ho toh previous version preserve ho sakta hai. `sync` without `--delete` destination ke extra files delete nahi karta. [CLI sync reference](https://docs.aws.amazon.com/cli/latest/reference/s3/sync.html)

### Public S3 website vs private S3 origin

| Direct S3 website endpoint | Private S3 + CloudFront |
| --- | --- |
| Static website hosting enable | Regular S3 REST origin use |
| Public read permissions needed | OAC se distribution ko access |
| Website endpoint HTTP-only | Viewer ko CloudFront HTTPS |
| Website index handling available | CloudFront default root object configure |

**S3 website endpoint HTTP-only hone ka matlab saara S3 HTTP-only nahi hai.** S3 REST/API endpoints HTTPS support karte hain. [Website endpoint distinction](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)

## 3. CloudFront kya hai aur kyun use karte hain?

**CloudFront AWS ka CDN — Content Delivery Network — hai.** CDN globally distributed locations se content deliver karta hai. Edge location delivery point hai; bucket ki AWS Region se alag concept hai.

Ye HTML, CSS, JS, images, downloads, video aur dynamic requests deliver kar sakta hai. Origin S3, load balancer ya HTTP server ho sakta hai. Har response cache karna zaroori nahi; behavior aur cache settings decide karte hain. [CloudFront overview](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)

### Important terms

| Term | Meaning |
| --- | --- |
| Origin | Original response/file ka source, jaise S3 |
| Distribution | CloudFront configuration: origins, domains, behaviors, certificate, etc. |
| Edge location | Visitor ke liye suitable delivery location |
| Cache hit | Requested response usable cache mein mil gaya |
| Cache miss | Edge par required cached response nahi mila |
| Behavior | Path pattern ke liye origin, protocol, caching rules |

Request pe CloudFront suitable edge location choose karta hai. Hit par origin fetch avoid ho sakta hai. Miss par regional cache/origin se content retrieve ho sakta hai. First request par bhi browser ko response milta hai; bas cached response jaisa benefit nahi mil sakta. Har request Mumbai bucket tak jaana zaroori nahi. Har edge par upload ke turant baad saari files pre-copy bhi nahi hoti. [Delivery flow](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/HowCloudFrontWorks.html)

### S3 ke saath CloudFront mandatory hai?

**Nahi.** S3 ko SDK/CLI, authorized REST request, presigned URL ya public website endpoint se use kar sakte ho.

Public website mein CloudFront useful hai: edge caching, HTTPS/custom-domain handling aur origin access control milta hai. Performance benefit workload, cache hits aur visitor location par depend karega; har request ke liye fixed speed guarantee nahi hai. [CloudFront capabilities](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)

### OAC kya hai?

**Origin Access Control** se CloudFront S3 ko signed requests bhejta hai. Bucket policy specific distribution ko objects read karne deti hai. Visitor public CloudFront URL use kar sakta hai, jabki bucket private rehta hai.

Recommended pattern: regular S3 origin + OAC + Sign requests + scoped bucket policy + Block Public Access ON. OAC ko S3 **website endpoint** ke saath use nahi kar sakte. “Viewer se CloudFront HTTPS” aur “CloudFront se S3 access” do alag connections/controls hain. [OAC setup](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)

### TTL, cache headers aur invalidation

TTL = Time To Live. CloudFront cache mein response kitni der fresh rahega, ye cache policy aur response headers se determine hota hai. DNS TTL alag cheez hai; dono same cache nahi hain.

`Cache-Control` examples:

```text
# HTML: changes jaldi check karwane ke liye
public, max-age=0, must-revalidate

# Content-hashed JS/CSS: filename change hone par naya asset
public, max-age=31536000, immutable
```

CloudFront minimum TTL headers se zyada caching enforce kar sakta hai. Sirf header dekhkar zero edge cache assume mat karo. [Cache expiration](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html)

Invalidation old edge cache ko unusable mark karti hai. Next request latest origin file fetch kar sakti hai. `/*` sab paths match karta hai. S3 files delete nahi hoti, browser cache clear nahi hota, aur DNS refresh nahi hota.

Update flow: **build → S3 upload → invalidation → completion → browser refresh**. Cache expiry tak wait ya versioned filenames bhi options hain. [Invalidation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html)

## 4. Route 53 kya hai?

**Route 53 AWS ki DNS service hai.** DNS domain names ko suitable destination information se map karta hai. Route 53 domain registration, authoritative DNS aur health checks ki capabilities bhi deta hai; inhe alag-alag use kar sakte ho.

Benefits: AWS resources ke liye Alias records, central DNS management, aur advanced routing options. Different applications mein simple, weighted, latency-based, failover ya geolocation routing ka use ho sakta hai. Portfolio ke liye simple routing generally enough hai. Route 53 files host nahi karta aur HTTP reverse proxy nahi hai. [Route 53 overview](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html)

### Hosted zone kya hai?

Hosted zone domain ke DNS records ka container hai. `ritikdevops.site` public hosted zone mein apex aur `www`, `api`, `mail` jaise subdomain records rakh sakte ho.

- **Public hosted zone:** internet DNS queries ke liye.
- **Private hosted zone:** associated VPC environment ke private DNS use ke liye.
- **Authoritative nameserver:** zone ke official records ka answer dene wala DNS server.
- **Recursive resolver:** browser/OS ki taraf se answer dhoondhta aur cache karta hai.

Hosted zone create karna domain purchase karna nahi hai. Same domain ki multiple hosted zones bana sakte ho, lekin public delegation jis zone ke NS par hai, usi ka answer relevant hoga. [DNS concepts](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/route-53-concepts.html)

### Kya Route 53 se poora connection secure ho jata hai?

**Nahi.** Route 53 DNS resolution deta hai. Website connection ki encryption TLS karta hai; S3 access IAM/bucket policy/OAC control karte hain.

DNSSEC configured ho toh DNS answers ki authenticity/integrity validate karne mein madad milti hai. Ye HTTPS ka replacement nahi, aur normal webpage content encrypt nahi karta. HTTPS bhi app bugs, compromised accounts ya wrong permissions ko automatically solve nahi karta. [Route 53 DNSSEC](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-configuring-dnssec.html)

### Route 53 ke alternatives

GoDaddy DNS, Cloudflare DNS aur doosre authoritative DNS providers bhi use ho sakte hain. AWS hosting ka matlab Route 53 mandatory nahi. Provider choose karte waqt DNS record support, apex handling, automation, cost aur operational needs dekho. Kisi alternative ko current price ya specific feature guarantee ke bina sirf example samjho.

## 5. GoDaddy ki zaroorat Route 53 ke baad bhi kyun?

Tumne GoDaddy se domain register kiya: GoDaddy tumhara **registrar** hai. Route 53 ko nameservers delegate kiye: Route 53 tumhara **DNS provider** hai. CloudFront content deliver karta hai; S3 store karta hai.

Registrar par domain renew karna aur registration contact/account secure rakhna ab bhi zaroori hai. Route 53 use karne se domain registration transfer nahi hoti. GoDaddy hosting/SSL package lena is architecture ke liye necessary nahi. Domain registration kisi aur supported registrar ko explicitly transfer karoge, tab registrar relationship badlegi. [Domain/DNS concepts](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/route-53-concepts.html)

### Nameserver kya hai? NS record kya hai?

Nameserver DNS queries answer karne wala server hai. NS record batata hai ki domain/zone ke authoritative nameservers kaun hain.

Registrar par nameserver configuration parent DNS zone ko delegation batati hai: “Is domain ke answers in servers se lo.” Route 53 zone ke assigned NS values use karo; kisi tutorial ke example NS ya doosri hosted zone ke NS mat copy karo.

GoDaddy Domain Portfolio → domain → DNS/Nameservers → Change Nameservers → custom nameservers → Route 53 ke chaar assigned values → save. Ye registrar-level change hai. GoDaddy ke ordinary DNS table mein bas NS row add kar dena same operation nahi. [GoDaddy nameserver instructions](https://www.godaddy.com/en-au/help/change-my-domain-nameservers-664)

Delegation ke baad public records Route 53 mein edit karo. GoDaddy ki old DNS zone edit karne se generally live answer nahi badlega. Nameserver switch se pehle required email MX/TXT, subdomains aur existing records preserve karo. Existing DNSSEC enabled ho toh migration mein registrar DS records ka coordination bhi chahiye. Changes caches expire hone par dikhte hain; har user ko ek hi moment par naya answer mile, zaroori nahi. [DNS migration guide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/migrate-dns-domain-in-use.html)

## 6. TLS, HTTPS aur certificate

**TLS = Transport Layer Security. HTTPS = HTTP ko TLS-protected connection par use karna.** “SSL certificate” naam common hai, lekin modern secure connections TLS use karte hain.

TLS teen main cheezein deta hai: data encryption, tampering detection/integrity, aur certificate-based endpoint authentication. Browser hostname match, validity aur trust chain jaise checks karta hai. Handshake mein keys agree hoti hain; certificate khud website ki file nahi hai.

Certificate mein domain names, public key aur issuer/signature information hoti hai. Private key public certificate se alag secret hai. Certificate website/company ke honest hone ki guarantee nahi deta; domain connection authenticate karta hai. [TLS explanation](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Transport_Layer_Security)

### ACM ka role aur DNS validation

ACM = AWS Certificate Manager. Public certificate request mein domain names specify karte ho. DNS validation ke liye ACM special CNAME name/value deta hai. Us record ko authoritative DNS mein add karke domain control demonstrate hota hai.

Example structure, actual values ACM se lo:

```text
_token.ritikdevops.site → _validation-token.acm-validations.aws
```

Ye **certificate-validation record** hai, website traffic ka record nahi. `Issued` status ka matlab certificate issue ho gaya; domain traffic automatically CloudFront par point nahi hota. Validation CNAME preserve karo aur ACM renewal conditions maintain karo. [DNS validation](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html)

### CloudFront ke liye N. Virginia hi kyun?

CloudFront ke viewer-facing ACM certificate ko **us-east-1** mein request/import karna AWS ki documented integration requirement hai. S3 bucket Mumbai mein ho sakta hai. Ye AWS service design hai; iska koi general TLS rule nahi hai ki certificates US mein hi banne chahiye. AWS documentation exact internal historical reason nahi batati, isliye “saara CloudFront US mein run hota hai” jaisa explanation galat hoga.

| Resource | Location |
| --- | --- |
| S3 bucket | Mumbai, `ap-south-1` |
| Viewer-facing ACM certificate for CloudFront | N. Virginia, `us-east-1` |
| CloudFront delivery | Global edge network |

Certificate region choose karne se visitor traffic US route hone ka rule nahi banta. Dusre services, jaise regional load balancer, ke certificate region requirements alag ho sakte hain. [AWS certificate requirements](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html)

## 7. CloudFront mein domain aur certificate kyun add karte hain?

Default distribution hostname `da8evm3o45s8s.cloudfront.net` hai. Custom hostname use karne ke liye CloudFront ko configure karna padta hai ki `ritikdevops.site` is distribution ka accepted naam hai. Isko **Alternate domain name** kehte hain.

CloudFront UI mein “Alternate domain names (CNAMEs)” label aata hai; iska matlab DNS mein necessarily CNAME-type record banana nahi. Route 53 par root domain ke liye A/AAAA Alias use hota hai.

Certificate usi endpoint par attach hota hai jo visitor ke saath TLS connection establish karta hai—yahan CloudFront. Certificate domain ko cover kare. `ritikdevops.site` aur `www.ritikdevops.site` alag hostnames hain. `*.ritikdevops.site` wildcard apex `ritikdevops.site` ko cover nahi karta. [Alternate names and certificate matching](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html)

### Teen settings ko alag yaad rakho

| Setting | Sawal jiska answer deti hai |
| --- | --- |
| Route 53 Alias | Browser kis destination ka address use kare? |
| CloudFront alternate domain | Ye hostname kis distribution par accepted hai? |
| Certificate | Kya endpoint is hostname ke liye trusted TLS identity dikha sakta hai? |

Sirf DNS point karna enough nahi. Sirf certificate issue karna bhi enough nahi. Custom HTTPS domain ke liye teeno match hone chahiye.

## 8. Route 53 mein Create record kyun?

Nameservers se resolver ko pata chala **kisse poochna hai**. Ab record se pata chalega **kya answer dena hai**. Hosted zone empty ho toh sirf nameservers hone se website destination set nahi hota.

| Record | Role | Example |
| --- | --- | --- |
| A | IPv4 answer | Server IP, ya Route 53 Alias to CloudFront |
| AAAA | IPv6 answer | IPv6-enabled CloudFront Alias |
| CNAME | Ek DNS naam ko doosre naam se map | ACM validation name |
| NS | Authoritative nameservers | Zone ke assigned DNS servers |
| SOA | Zone ki administrative/control information | Route 53 automatically creates |
| MX | Mail delivery destination | Domain email provider |
| TXT | Text values, often verification/email policies | SPF ya ownership verification |

Route 53 Alias AWS-specific feature hai; separate standard DNS record type nahi. Client ko A/AAAA answer milta hai. Apex par normal CNAME allowed nahi; Alias AWS targets ke liye apex par bhi kaam karta hai. CloudFront IP manually A record mein hardcode mat karo. [Alias vs CNAME](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html)

DNS mapping HTTP redirect nahi hai. Dono hostnames same site khol sakte hain, lekin `www` se apex URL automatically change karwana alag redirect configuration hai.

## 9. Setup sequence — action aur reason saath-saath

| Step | Action | Kyun |
| --- | --- | --- |
| 1 | Static files S3 mein upload | Origin ke paas actual content ho |
| 2 | CloudFront distribution, S3 REST origin, OAC | Delivery aur private origin access |
| 3 | Default root object `index.html` | `/` request par homepage object mile |
| 4 | Public hosted zone create/reuse | Domain records manage karne ki jagah |
| 5 | Existing records preserve, GoDaddy NS update | Public delegation Route 53 ko mile |
| 6 | ACM us-east-1 certificate request | CloudFront-compatible TLS certificate |
| 7 | Validation CNAME add, Issued wait | Domain control verify ho |
| 8 | CloudFront alternate names + certificate attach | Domain accept ho aur TLS identity mile |
| 9 | Route 53 A Alias, optional AAAA Alias | Browser ko CloudFront ka address mile |
| 10 | Deployment/DNS updates ke baad test | Configuration end-to-end verify ho |

CloudFront: General → Settings → Edit → alternate names and custom certificate. Names mein `https://` ya path nahi, sirf hostname. Default behavior mein Redirect HTTP to HTTPS configure kar sakte ho.

Route 53: hosted zone → Create record → name blank for apex / `www` for subdomain → A → Alias ON → CloudFront target choose → Simple routing → Evaluate target health No. IPv6 enabled ho toh matching AAAA records bhi. Target mein CloudFront distribution select hoti hai; root domain ka CNAME banane ki koshish mat karo. [Route 53 to CloudFront setup](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-cloudfront-distribution.html)

Ye sequence simple new-site setup ke liye hai. Existing production site migrate karte waqt DNS cutover carefully stage karo. Duplicate hosted zones/distributions create karna routine update ka step nahi hai.

### Console practice: certificate se domain tak

1. **ACM:** region us-east-1 → Request certificate → Public certificate. Names: `ritikdevops.site` aur, agar use karna hai, `www.ritikdevops.site`. DNS validation select karke request karo. CloudFront ke normal managed use ke liye certificate export karna zaroori nahi.
2. **Validation:** certificate details → Create records in Route 53. Sahi public zone select karo. Button available nahi ho toh ACM ke exact CNAME name/value ko authoritative DNS mein manually add karo. Status Issued hone do.
3. **CloudFront:** existing distribution → General/Settings → Edit. Alternate domain names mein dono requested hostnames add karo. Custom SSL certificate mein Issued certificate select karo → Save. Deployment complete hone do.
4. **Route 53:** apex ka A Alias CloudFront ko point karo. `www` chahiye toh uska bhi record, certificate coverage aur alternate name chahiye. Default root object `index.html` verify karo.
5. **Test:** apex aur www ko separately HTTPS se kholo. DNS error, TLS warning aur HTTP 403 alag stages ki failures hain; troubleshooting table se correct layer identify karo.

Certificate step ke liye [ACM request instructions](https://docs.aws.amazon.com/acm/latest/userguide/acm-public-certificates.html) aur [DNS validation](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html) dekho. Console ka exact layout badal sakta hai, lekin required values aur roles wahi rahenge.

## 10. Charges — kya free hai, kya paid?

**Pricing checked: 27 September 2026. USD figures taxes ke bina; exact bill plan, usage aur eligibility par depend karega.**

| Item | Billing idea |
| --- | --- |
| GoDaddy domain | Registration/renewal charge; `.site` ka renewal promotional purchase price se alag ho sakta hai. Exact price GoDaddy account mein dekho. |
| S3 | Storage, requests, applicable transfer, storage-class retrieval aur optional features. Mumbai/current rates pricing page par select karo. |
| Route 53 standard pay-as-you-go | First 25 hosted zones ke liye **$0.50 per zone/month**. Standard DNS queries first tier **$0.40 per million**. |
| Route 53 Alias to CloudFront | Eligible Alias A/AAAA queries ka DNS query charge nahi; standalone hosted-zone charge phir bhi ho sakta hai. |
| CloudFront | Pay-as-you-go aur flat-rate plans dono hain. Selected plan ke allowances/inclusions dekho. |
| ACM public non-exportable certificate | Integrated AWS services ke liye certificate ka additional charge nahi. Exportable/public ACME/private CA products ke pricing rules alag hain. |

Route 53 standalone hosted-zone monthly charge partial month ke liye normally prorated nahi. Paid health checks/optional features separate ho sakte hain. **“Alias queries free” ka matlab “saara Route 53 free” nahi.** [Route 53 pricing](https://aws.amazon.com/route53/pricing/)

CloudFront ke current flat-rate plans mein Free plan bhi hai, aur DNS/TLS jaise bundled features ho sakte hain. Route 53 zone ko eligible plan ke saath associate karne par covered costs alag ho sakte hain. Har existing hosted zone automatically included assume mat karo. Account ka selected plan check kiye bina “tumhara bill zero hai” ya “tumhe zaroor $0.50 lagega” conclude nahi karna. [CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/), [plan coverage](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/flat-rate-pricing-plan.html)

S3 Versioning se retained old versions bhi storage use karte hain. Archive classes mein retrieval charges/delay ho sakta hai. Total cost sirf uploaded folder size ka naam nahi. [S3 pricing](https://aws.amazon.com/s3/pricing/)

CloudFront ke liye ordinary non-exportable ACM public certificate select karna aur paid exportable certificate lena alag options hain. [ACM pricing](https://aws.amazon.com/certificate-manager/pricing/)

Billing & Cost Management mein Bills/Cost Explorer se actual usage dekho. Budget alert notification hai, automatic hard spending limit nahi.

## 11. Common confusion aur troubleshooting

| Symptom / confusion | Pehle kya check karein |
| --- | --- |
| Domain does not resolve / NXDOMAIN | Registrar delegation, correct hosted zone, A/AAAA record, DNS cache |
| Certificate Pending validation | ACM CNAME authoritative DNS mein exact hai? Nameservers correct hain? |
| Certificate CloudFront dropdown mein nahi | us-east-1, Issued status, correct account/permissions |
| Browser certificate mismatch | Certificate requested hostname ko cover karta hai? Correct distribution? |
| CloudFront 403 | S3 key exists? Root object? OAC/policy? Alternate hostname? 403 ka ek hi cause nahi hota. |
| Homepage works, CSS missing | `_next/` upload, object permissions, paths, browser Network errors |
| Old content | S3 object updated? CloudFront cache? Browser cache? |
| `www` works, apex fails | Apex Alias, alternate name aur certificate coverage separately check |
| DNS update kar diya, browser URL same hai | DNS mapping redirect nahi hai |
| Nameservers badle, email band | Old MX/TXT/email-related records migrate hue? |
| Private bucket ka website endpoint 403 | OAC design mein direct public endpoint blocked hona expected; CloudFront test karo |

Read-only diagnostic commands, PowerShell:

```powershell
# Kaun DNS authority hai?
Resolve-DnsName ritikdevops.site -Type NS

# IPv4 destination answers
Resolve-DnsName ritikdevops.site -Type A

# IPv6, agar configured hai
Resolve-DnsName ritikdevops.site -Type AAAA

# HTTP response headers; curl.exe se Windows PowerShell alias confusion avoid hota hai
curl.exe -I https://ritikdevops.site/
```

Ye commands diagnosis hain, configuration change nahi karte. DNS result aur certificate success AWS bucket policy ke saare aspects verify nahi karte. Ek domain ka successful test doosre `www` hostname ka test nahi hai.

## 12. Revision sheet — ek minute mein yaad karo

**Store → Deliver → Find → Trust**

- Store: S3 objects rakhta hai.
- Deliver: CloudFront files serve/cache karta hai.
- Find: DNS/Route 53 destination answer deta hai.
- Trust: TLS endpoint authenticate karke connection protect karta hai; ACM certificate manage karta hai.
- Own/renew name: registrar, yahan GoDaddy.

| Sawal | Short answer |
| --- | --- |
| S3 aur EC2 same? | Nahi: object storage vs virtual compute server. |
| S3 ke liye CloudFront mandatory? | Nahi; website delivery/HTTPS/private-origin pattern mein useful. |
| AWS website ke liye Route 53 mandatory? | Nahi; suitable external DNS bhi use ho sakta hai. |
| Route 53 lagaya toh GoDaddy renewal band? | Nahi; registrar abhi GoDaddy hai. |
| Hosted zone banayi toh domain khareed liya? | Nahi. |
| NS change kya karta hai? | Authoritative DNS delegation badalta hai. |
| TLS certificate se DNS record ban jata hai? | Nahi. |
| DNS record se certificate attach hota hai? | Nahi. |
| CloudFront certificate Mumbai mein? | Viewer-facing ACM certificate us-east-1 mein. |
| Certificate US mein toh traffic US jayega? | Aisa rule nahi. |
| `/*` invalidation S3 delete karti hai? | Nahi, edge cache invalidate hota hai. |
| HTTPS matlab fully secure app? | Nahi, transport protection ek layer hai. |

**Interview answer, apne words mein:**

“Static assets ko S3 mein store karte hain. CloudFront unhe edge locations se deliver karta hai aur custom-domain HTTPS terminate karta hai. Route 53 authoritative DNS ke through domain ko distribution se map karta hai. Registrar par Route 53 nameservers delegate hote hain. ACM certificate domain control validate karke manage karta hai; CloudFront ke viewer-facing certificate ke liye us-east-1 use hota hai.”

## 13. Khud ko test karo

1. CloudFront cache hit mein S3 request hamesha kyun nahi hoti?
2. Nameservers aur A Alias dono kyun chahiye?
3. Certificate validation CNAME aur website Alias ka kaam alag kaise hai?
4. Route 53 use karke bhi GoDaddy domain renew kyun karna hai?
5. Mumbai S3 aur us-east-1 certificate saath kaise kaam karte hain?
6. DNS change, website update aur certificate replacement mein alag actions kya hain?

Answers notes mein hain. Inko bina dekhe explain kar pao, toh tum sirf console steps yaad nahi kar rahe—architecture samajh rahe ho.
