import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ 
    title, 
    description, 
    canonical,
    type = 'website'
}) {
    const siteName = "Zylron AI";
    const fullTitle = title ? `${title} | ${siteName}` : `${siteName} | Next-Gen Neural Assistant`;
    const fullDescription = description || "Experience the future of artificial intelligence with Zylron. A premium, glassmorphic neural workspace designed for ultimate productivity.";
    const url = canonical ? `https://www.zylronai.app${canonical}` : 'https://www.zylronai.app';

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={fullDescription} />
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={fullDescription} />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:image" content="https://www.zylronai.app/logo.png" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={fullDescription} />
            <meta property="twitter:image" content="https://www.zylronai.app/logo.png" />
        </Helmet>
    );
}
