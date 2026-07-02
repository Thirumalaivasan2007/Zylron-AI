const fs = require('fs');
const path = require('path');

const seoConfig = {
    'Features.jsx': { title: 'Features', path: '/features' },
    'MathSolver.jsx': { title: 'Neural Math Engine', path: '/features/math-solver' },
    'StudyGuides.jsx': { title: 'Smart Study Guides', path: '/features/study-guides' },
    'SecureVault.jsx': { title: 'Zero-Knowledge Vault', path: '/features/secure-vault' },
    'Students.jsx': { title: 'For Students', path: '/students' },
    'Developers.jsx': { title: 'For Developers', path: '/developers' },
    'Pricing.jsx': { title: 'Pricing', path: '/pricing' },
    'About.jsx': { title: 'About Zylron', path: '/about' },
    'Security.jsx': { title: 'Security', path: '/security' },
    'TermsOfService.jsx': { title: 'Terms of Service', path: '/terms-of-service' },
    'PrivacyPolicy.jsx': { title: 'Privacy Policy', path: '/privacy-policy' }
};

const dir = path.join(__dirname, 'src/pages/marketing');

for (const [file, config] of Object.entries(seoConfig)) {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Add import if missing
    if (!content.includes('import SEO from')) {
        content = content.replace(/(import React.*?;\n)/, $1import SEO from '../../components/SEO';\n);
    }

    // Add SEO tag inside the first div
    if (!content.includes('<SEO title=')) {
        content = content.replace(/(return \(\s*<div[^>]*>)/, $1\n            <SEO title="" canonical="" />);
    }

    fs.writeFileSync(filePath, content);
}
console.log('SEO injected to all marketing pages');
