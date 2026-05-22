const PptxGenJS = require('pptxgenjs');

/**
 * Generate PowerPoint untuk Presentation
 */
const generatePresentationPPT = async (presentationData, outputPath) => {
    try {
        const pptx = new PptxGenJS();

        // Set layout
        pptx.layout = 'LAYOUT_16x9';

        // Slide 1: Title Slide
        const titleSlide = pptx.addSlide();
        titleSlide.background = { color: '2C3E50' };
        
        titleSlide.addText(presentationData.topik || 'Presentasi', {
            x: 0.5,
            y: 2.5,
            w: 9,
            h: 1.5,
            fontSize: 44,
            bold: true,
            color: 'FFFFFF',
            align: 'center'
        });

        if (presentationData.tujuan) {
            titleSlide.addText(presentationData.tujuan, {
                x: 1,
                y: 4.2,
                w: 8,
                h: 0.5,
                fontSize: 18,
                color: 'ECF0F1',
                align: 'center'
            });
        }

        // Content Slides
        if (presentationData.slides_json && presentationData.slides_json.length > 0) {
            presentationData.slides_json.forEach((slideData) => {
                const slide = pptx.addSlide();
                
                // Background
                slide.background = { color: 'FFFFFF' };

                // Title
                slide.addText(slideData.title || `Slide ${slideData.slide_number}`, {
                    x: 0.5,
                    y: 0.5,
                    w: 9,
                    h: 0.8,
                    fontSize: 32,
                    bold: true,
                    color: '2C3E50',
                    align: 'left'
                });

                // Content
                if (slideData.content && Array.isArray(slideData.content)) {
                    const bulletPoints = slideData.content.map(item => ({
                        text: item,
                        options: { bullet: true, fontSize: 18, color: '34495E' }
                    }));

                    slide.addText(bulletPoints, {
                        x: 0.8,
                        y: 1.8,
                        w: 8.4,
                        h: 3.5,
                        fontSize: 18,
                        color: '34495E'
                    });
                }

                // Speaker Notes
                if (slideData.catatan) {
                    slide.addNotes(slideData.catatan);
                }

                // Footer
                slide.addText(`Slide ${slideData.slide_number}`, {
                    x: 8.5,
                    y: 5.2,
                    w: 1,
                    h: 0.3,
                    fontSize: 10,
                    color: '95A5A6',
                    align: 'right'
                });
            });
        }

        // Save file
        await pptx.writeFile({ fileName: outputPath });
        return outputPath;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    generatePresentationPPT
};
