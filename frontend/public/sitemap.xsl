<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>Zylron AI | Advanced Sitemap</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&amp;display=swap');
          
          body {
            font-family: 'Outfit', sans-serif;
            background-color: #020617;
            color: #f8fafc;
            margin: 0;
            padding: 40px;
          }
          #header {
            text-align: center;
            margin-bottom: 40px;
          }
          h1 {
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(135deg, #06b6d4, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
          }
          p.desc {
            color: #94a3b8;
            font-size: 1.1rem;
            max-width: 600px;
            margin: 0 auto;
          }
          .table-container {
            max-width: 1000px;
            margin: 0 auto;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            backdrop-filter: blur(10px);
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: rgba(255, 255, 255, 0.05);
            color: #38bdf8;
            text-align: left;
            padding: 16px 24px;
            font-weight: 600;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 1px;
          }
          td {
            padding: 16px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            transition: background 0.2s ease;
          }
          tr:hover td {
            background: rgba(255, 255, 255, 0.03);
          }
          a {
            color: #f8fafc;
            text-decoration: none;
            transition: color 0.2s ease;
            font-weight: 400;
          }
          a:hover {
            color: #06b6d4;
          }
          .priority {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
          }
          .priority-low {
            background: rgba(148, 163, 184, 0.15);
            color: #94a3b8;
          }
          .priority-high {
            background: rgba(6, 182, 212, 0.15);
            color: #06b6d4;
          }
          .freq {
            color: #cbd5e1;
            font-size: 0.9rem;
            text-transform: capitalize;
          }
        </style>
      </head>
      <body>
        <div id="header">
          <h1>Neural Sitemap Directory</h1>
          <p class="desc">
            This is an advanced XML sitemap formatted for humans. Search engines like Google will automatically process the underlying XML data to index the Zylron AI ecosystem.
          </p>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Neural Path (URL)</th>
                <th>Priority</th>
                <th>Change Freq</th>
                <th>Last Synced</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <a href="{sitemap:loc}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <xsl:choose>
                      <xsl:when test="sitemap:priority &gt;= 0.9">
                        <span class="priority priority-high"><xsl:value-of select="sitemap:priority"/></span>
                      </xsl:when>
                      <xsl:when test="sitemap:priority &lt;= 0.6">
                        <span class="priority priority-low"><xsl:value-of select="sitemap:priority"/></span>
                      </xsl:when>
                      <xsl:otherwise>
                        <span class="priority"><xsl:value-of select="sitemap:priority"/></span>
                      </xsl:otherwise>
                    </xsl:choose>
                  </td>
                  <td>
                    <span class="freq"><xsl:value-of select="sitemap:changefreq"/></span>
                  </td>
                  <td style="color: #64748b; font-size: 0.9rem;">
                    <xsl:value-of select="substring(sitemap:lastmod, 0, 11)"/>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
