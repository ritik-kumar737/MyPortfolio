// Profile and learning projects based on Ritik's supplied details.
// Add verified live URLs, repository links and a resume when available.
export const profile = {
  name: 'Ritik Kumar', initials: 'r.', role: 'Aspiring DevOps Engineer',
  email: 'ritikkumar7123@gmail.com', github: 'https://github.com/RITIKKUMAR2961', linkedin: 'https://www.linkedin.com/in/ritik-kumar-363ba321a/', resume: '',
  location: 'India', available: true,
};
export const projects = [
  { id: 'compute', name: 'Static websites on EC2', category: 'AWS / NGINX & APACHE DEPLOYMENT', description: 'Deployed static websites on Amazon EC2 using Nginx and Apache, putting Linux web-server skills into practice.', detail: 'Hands-on experience deploying static websites on EC2 with Nginx and Apache. This project connects Linux server administration with web hosting on AWS. I shared my deployment work in the linked LinkedIn post.', tags: ['EC2', 'Nginx', 'Apache', 'Linux'], type: 'compute', url: '', github: '', proofUrl: 'https://lnkd.in/p/gDFsWcqG', sample: false },
  { id: 'hosting', name: 'Cloud-hosted portfolio', category: 'AWS / STATIC WEBSITE HOSTING', description: 'Deployed my Next.js portfolio to Amazon S3, with CloudFront delivering the static files over HTTPS.', detail: 'Built and exported this Next.js portfolio as static HTML, CSS, and JavaScript, hosted it on Amazon S3, and connected CloudFront for delivery through edge locations. The portfolio is live over HTTPS — open the project link to explore it.', tags: ['Amazon S3', 'CloudFront', 'Next.js'], type: 'hosting', url: 'https://da8evm3o45s8s.cloudfront.net/', github: '', sample: false },
  { id: 'domain', name: 'From domain to HTTPS', category: 'NETWORKING / DNS & TLS — LIVE', description: 'Connected my GoDaddy domain ritikdevops.site to this portfolio using Route 53, CloudFront, and an ACM TLS certificate.', detail: 'Configured DNS through Route 53, connected ritikdevops.site to my CloudFront distribution, and set up an AWS Certificate Manager (ACM) TLS certificate. My portfolio is now live on its custom domain over HTTPS, bringing together domain management, DNS, and secure website delivery.', tags: ['Route 53', 'CloudFront', 'AWS ACM', 'GoDaddy', 'TLS / HTTPS'], type: 'domain', url: 'https://ritikdevops.site/', github: '', sample: false },
];

export const scripts = [
  { file: 'backup.sh', command: 'bash backup.sh', description: 'My shell scripting project for automating folder backups from the Linux terminal.', focus: 'Backup automation', repository: 'https://github.com/RITIKKUMAR2961/bash-folder-backup.git' },
  { file: 'LinuxServerHealthChecker.sh', command: 'bash LinuxServerHealthChecker.sh', description: 'My Linux server health-checking script, built as part of my hands-on system monitoring practice.', focus: 'System health checks', repository: 'https://github.com/RITIKKUMAR2961/Linux-Server-Health-Checker.git' },
];
