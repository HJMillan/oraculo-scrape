// Debug utility: inspect raw text elements from page 0 of the Canva site.
// Uses native fetch (no external dependencies).

try {
    const res = await fetch('https://pob.my.canva.site/oraculo');
    const html = await res.text();

    const bootstrapRegex = /window\['bootstrap'\]\s*=\s*JSON\.parse\('(.+?)'\);/;
    const match = html.match(bootstrapRegex);

    if (match && match[1]) {
        let rawJson = match[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\");
        const canvaData = JSON.parse(rawJson);

        const pages = canvaData.page.A.A || [];

        if (pages.length > 0) {
            const page = pages[0]; // inspect page 0 only
            console.log(`\n\n=== PAGE 0 (First Page) ===`);
            const elements = page.E || [];

            const textElements = [];

            elements.forEach((el, elIndex) => {
                if (el.a && el.a.A && Array.isArray(el.a.A)) {
                    const text = el.a.A.map(segment => segment.A || '').join('').trim();
                    if (text) {
                        textElements.push({
                            text,
                            y: el.B,
                            x: el.A,
                            index: elIndex
                        });
                    }
                }
            });

            // Sort by Y
            textElements.sort((a, b) => a.y - b.y);

            textElements.forEach(item => {
                console.log(`[Y=${Math.round(item.y)}] ${item.text}`);
            });
        }
    }
} catch (e) {
    console.error(e);
}
