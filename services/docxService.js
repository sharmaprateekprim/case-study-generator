const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TabStopPosition, TabStopType, Header, Footer, PageNumber, ImageRun, Media, BorderStyle } = require('docx');
const fs = require('fs');
const path = require('path');

class DocxService {
  async generateCaseStudyDocx(questionnaire, labels = {}, caseStudyFolder = '') {
    console.log('Starting DOCX case study generation...');
    
    // DEBUG: Log content being processed
    console.log('🔍 DEBUG - DOCX Service received content:');
    console.log('  Basic Info:', questionnaire.basicInfo);
    console.log('  Content fields:');
    console.log('    Executive Summary:', questionnaire.content?.executiveSummary ? `${questionnaire.content.executiveSummary.length} chars` : 'EMPTY');
    console.log('    Overview:', questionnaire.content?.overview ? `${questionnaire.content.overview.length} chars` : 'EMPTY');
    console.log('    Challenge:', questionnaire.content?.challenge ? `${questionnaire.content.challenge.length} chars` : 'EMPTY');
    console.log('    Solution:', questionnaire.content?.solution ? `${questionnaire.content.solution.length} chars` : 'EMPTY');
    console.log('    Results:', questionnaire.content?.results ? `${questionnaire.content.results.length} chars` : 'EMPTY');
    console.log('  Metrics:', questionnaire.metrics);
    
    try {
      // Extract data from questionnaire structure
      const basicInfo = questionnaire.basicInfo || {};
      const content = questionnaire.content || {};
      const metrics = questionnaire.metrics || {};
      
      // Create header with case study title
      const header = new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: basicInfo.title || 'Case Study',
                font: "Calibri",
                size: 20,
                color: "000000"
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 0 }
          })
        ]
      });
      
      // Create footer with page number
      const footer = new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Page ",
                font: "Calibri",
                size: 20,
                color: "000000"
              }),
              new TextRun({
                children: [PageNumber.CURRENT],
                font: "Calibri",
                size: 20,
                color: "000000"
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 }
          })
        ]
      });

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: "Calibri",
                size: 22, // 11pt in half-points
                color: "000000"
              },
              paragraph: {
                alignment: AlignmentType.LEFT,
                indent: {
                  left: 0
                }
              }
            }
          },
          paragraphStyles: [
            {
              id: "Title",
              name: "Title",
              basedOn: "Normal",
              next: "Normal",
              run: {
                font: "Calibri",
                size: 32, // 16pt
                bold: true,
                color: "000000"
              },
              paragraph: {
                alignment: AlignmentType.LEFT,
                spacing: {
                  after: 400
                },
                border: {
                  bottom: {
                    color: "000000",
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6
                  }
                }
              }
            },
            {
              id: "Heading1",
              name: "Heading 1",
              basedOn: "Normal",
              next: "Normal",
              run: {
                font: "Calibri",
                size: 28, // 14pt
                bold: true,
                color: "000000"
              },
              paragraph: {
                alignment: AlignmentType.LEFT,
                spacing: {
                  before: 400,
                  after: 200
                }
              }
            },
            {
              id: "Heading2",
              name: "Heading 2",
              basedOn: "Normal",
              next: "Normal",
              run: {
                font: "Calibri",
                size: 24, // 12pt
                bold: true,
                color: "000000"
              },
              paragraph: {
                alignment: AlignmentType.LEFT,
                spacing: {
                  before: 300,
                  after: 150
                }
              }
            },
            {
              id: "Normal",
              name: "Normal",
              run: {
                font: "Calibri",
                size: 22, // 11pt
                color: "000000"
              },
              paragraph: {
                alignment: AlignmentType.LEFT,
                spacing: {
                  after: 120
                }
              }
            }
          ]
        },
        sections: [{
          properties: {
            page: {
              margin: {
                top: 720,    // 0.5 inch in twentieths of a point (720 = 0.5 * 1440)
                right: 720,  // 0.5 inch
                bottom: 720, // 0.5 inch
                left: 720    // 0.5 inch
              }
            }
          },
          headers: {
            default: header
          },
          footers: {
            default: footer
          },
          children: [
            // Title with Generated Date and bottom border
            new Paragraph({
              children: [
                new TextRun({
                  text: basicInfo.title || 'Case Study',
                  font: "Calibri",
                  size: 32,
                  bold: true,
                  color: "000000"
                }),
              ],
              style: "Title"
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on: ${new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}`,
                  font: "Calibri",
                  size: 22,
                  color: "000000",
                  italics: true
                }),
              ],
              spacing: { after: 400 }
            }),

            // Background Section
            new Paragraph({
              children: [
                new TextRun({
                  text: "Background",
                  font: "Calibri",
                  size: 28,
                  bold: true,
                  color: "000000"
                }),
              ],
              style: "Heading1"
            }),

            ...this.createBackgroundParagraphs(basicInfo, labels),

            // Executive Summary
            ...(content.executiveSummary ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Executive Summary",
                    font: "Calibri",
                    size: 28,
                    bold: true,
                    color: "000000"
                  }),
                ],
                style: "Heading1"
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: content.executiveSummary,
                    font: "Calibri",
                    size: 22,
                    color: "000000"
                  }),
                ],
                style: "Normal"
              })
            ] : []),

            // Key Metrics
            new Paragraph({
              children: [
                new TextRun({
                  text: "Key Metrics",
                  font: "Calibri",
                  size: 28,
                  bold: true,
                  color: "000000"
                }),
              ],
              style: "Heading1"
            }),

            ...this.createMetricsParagraphs(metrics),

            // Overview
            ...(content.overview ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Overview",
                    font: "Calibri",
                    size: 28,
                    bold: true,
                    color: "000000"
                  }),
                ],
                style: "Heading1"
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: content.overview,
                    font: "Calibri",
                    size: 22,
                    color: "000000"
                  }),
                ],
                style: "Normal"
              })
            ] : []),

            // Challenges
            new Paragraph({
              children: [
                new TextRun({
                  text: "Challenges",
                  font: "Calibri",
                  size: 28,
                  bold: true,
                  color: "000000"
                }),
              ],
              style: "Heading1"
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: content.challenge || 'Challenge description not provided.',
                  font: "Calibri",
                  size: 22,
                  color: "000000"
                }),
              ],
              style: "Normal"
            }),

            // Solution Approach
            new Paragraph({
              children: [
                new TextRun({
                  text: "Solution Approach",
                  font: "Calibri",
                  size: 28,
                  bold: true,
                  color: "000000"
                }),
              ],
              style: "Heading1"
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: content.solution || 'Solution description not provided.',
                  font: "Calibri",
                  size: 22,
                  color: "000000"
                }),
              ],
              style: "Normal"
            }),

            // Architecture Diagrams (embedded)
            ...(await this.createArchitectureDiagramsParagraphs(content.architectureDiagrams, caseStudyFolder)),

            // Implementation Workstreams
            ...(content.implementationWorkstreams && content.implementationWorkstreams.length > 0 && 
                content.implementationWorkstreams.some(w => w.name || w.description) ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Implementation Workstreams",
                    font: "Calibri",
                    size: 28,
                    bold: true,
                    color: "000000"
                  }),
                ],
                style: "Heading1"
              }),
              
              ...(await this.createWorkstreamsParagraphs(content.implementationWorkstreams, caseStudyFolder))
            ] : []),

            // Results
            new Paragraph({
              children: [
                new TextRun({
                  text: "Results",
                  font: "Calibri",
                  size: 28,
                  bold: true,
                  color: "000000"
                }),
              ],
              style: "Heading1"
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: content.results || 'Results description not provided.',
                  font: "Calibri",
                  size: 22,
                  color: "000000"
                }),
              ],
              style: "Normal"
            }),

            // Lessons Learnt
            ...(content.lessonsLearned ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Lessons Learnt",
                    font: "Calibri",
                    size: 28,
                    bold: true,
                    color: "000000"
                  }),
                ],
                style: "Heading1"
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: content.lessonsLearned,
                    font: "Calibri",
                    size: 22,
                    color: "000000"
                  }),
                ],
                style: "Normal"
              })
            ] : []),

            // Conclusion
            ...(content.conclusion ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Conclusion",
                    font: "Calibri",
                    size: 28,
                    bold: true,
                    color: "000000"
                  }),
                ],
                style: "Heading1"
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: content.conclusion,
                    font: "Calibri",
                    size: 22,
                    color: "000000"
                  }),
                ],
                style: "Normal"
              })
            ] : [])
          ]
        }]
      });

      console.log('DOCX case study generated successfully');
      return await Packer.toBuffer(doc);
    } catch (error) {
      console.error('Error generating DOCX case study:', error);
      throw new Error(`Failed to generate DOCX case study: ${error.message}`);
    }
  }

  async createArchitectureDiagramsParagraphs(architectureDiagrams, caseStudyFolder) {
    if (!architectureDiagrams || architectureDiagrams.length === 0) {
      return [];
    }

    const paragraphs = [
      new Paragraph({
        children: [
          new TextRun({
            text: "Architecture Diagrams:",
            font: "Calibri",
            size: 24,
            bold: true,
            color: "000000"
          }),
        ],
        style: "Heading2"
      })
    ];

    for (const diagram of architectureDiagrams) {
      try {
        // Add diagram title
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: diagram.name,
                font: "Calibri",
                size: 22,
                bold: true,
                color: "000000"
              }),
            ],
            style: "Normal",
            spacing: { before: 200, after: 100 }
          })
        );

        // Try to embed the image if it's an image file
        if (this.isImageFile(diagram.type)) {
          const imageParagraph = await this.createImageParagraph(diagram, caseStudyFolder);
          if (imageParagraph) {
            paragraphs.push(imageParagraph);
          }
        } else {
          // For non-image files (like PDFs), show a reference
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `📄 ${diagram.name} (${diagram.type})`,
                  font: "Calibri",
                  size: 22,
                  color: "000000",
                  italics: true
                }),
              ],
              style: "Normal"
            })
          );
        }
      } catch (error) {
        console.warn(`Failed to embed diagram ${diagram.name}:`, error);
        // Fallback to text reference
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${diagram.name} (${diagram.type})`,
                font: "Calibri",
                size: 22,
                color: "000000"
              }),
            ],
            style: "Normal"
          })
        );
      }
    }

    return paragraphs;
  }

  // Calculate optimal image dimensions for document width
  calculateImageDimensions(originalWidth, originalHeight, isOnePager = false) {
    // Standard Word document usable width is approximately 6.5 inches (468 points)
    // Convert to pixels: 6.5 inches * 72 DPI = 468 points
    // Using different sizing for one-pager vs full document
    const maxDocumentWidth = isOnePager ? 520 : 580; // Slightly smaller for one-pager
    const maxDocumentHeight = isOnePager ? 390 : 435; // Proportionally smaller height
    
    // If we don't have original dimensions, use default responsive sizing
    if (!originalWidth || !originalHeight) {
      return {
        width: maxDocumentWidth,
        height: maxDocumentHeight
      };
    }
    
    // Calculate aspect ratio
    const aspectRatio = originalWidth / originalHeight;
    
    // Start with width-constrained sizing
    let targetWidth = maxDocumentWidth;
    let targetHeight = targetWidth / aspectRatio;
    
    // If height exceeds constraint, switch to height-constrained sizing
    if (targetHeight > maxDocumentHeight) {
      targetHeight = maxDocumentHeight;
      targetWidth = targetHeight * aspectRatio;
    }
    
    // Ensure minimum readable size
    const minWidth = 300;
    const minHeight = 200;
    
    // If the image is too small after scaling, scale it up to minimum size
    if (targetWidth < minWidth && targetHeight < minHeight) {
      // Scale up based on which dimension needs more scaling
      const widthScale = minWidth / targetWidth;
      const heightScale = minHeight / targetHeight;
      const scale = Math.min(widthScale, heightScale);
      
      targetWidth = targetWidth * scale;
      targetHeight = targetHeight * scale;
      
      // Re-check constraints after scaling up
      if (targetWidth > maxDocumentWidth) {
        targetWidth = maxDocumentWidth;
        targetHeight = targetWidth / aspectRatio;
      }
      if (targetHeight > maxDocumentHeight) {
        targetHeight = maxDocumentHeight;
        targetWidth = targetHeight * aspectRatio;
      }
    }
    
    return {
      width: Math.round(targetWidth),
      height: Math.round(targetHeight)
    };
  }

  async createImageParagraph(diagram, caseStudyFolder, isOnePager = false) {
    try {
      // For now, we'll download the image from S3 and embed it
      const s3Service = require('./s3Service');
      const imageBuffer = await s3Service.downloadFile(caseStudyFolder, diagram.fileName);
      
      // Calculate optimal dimensions for document width
      // Note: We don't have access to original image dimensions here without additional processing
      // So we'll use a responsive default that works well for most diagrams
      const dimensions = this.calculateImageDimensions(null, null, isOnePager);
      
      // Create image with appropriate sizing to fit document width
      const imageRun = new ImageRun({
        data: imageBuffer,
        transformation: {
          width: dimensions.width,
          height: dimensions.height
        },
        type: this.getImageType(diagram.type)
      });

      return new Paragraph({
        children: [imageRun],
        alignment: AlignmentType.CENTER,
        spacing: { 
          before: isOnePager ? 100 : 200, 
          after: isOnePager ? 100 : 200 
        }
      });
    } catch (error) {
      console.warn(`Failed to create image paragraph for ${diagram.name}:`, error);
      return null;
    }
  }

  isImageFile(mimeType) {
    return mimeType && (
      mimeType.startsWith('image/') && 
      !mimeType.includes('svg') // SVG might need special handling
    );
  }

  getImageType(mimeType) {
    switch (mimeType) {
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/gif':
        return 'gif';
      default:
        return 'png'; // Default fallback
    }
  }

  createBackgroundParagraphs(basicInfo, labels = {}) {
    const backgroundItems = [
      { label: "Project Duration", value: basicInfo.duration },
      { label: "Team Size", value: basicInfo.teamSize },
      { label: "Point of Contact(s)", value: basicInfo.pointOfContact }
    ];

    const paragraphs = backgroundItems
      .filter(item => item.value)
      .map(item => 
        new Paragraph({
          children: [
            new TextRun({
              text: `${item.label}: `,
              font: "Calibri",
              size: 22,
              bold: true,
              color: "000000"
            }),
            new TextRun({
              text: item.value,
              font: "Calibri",
              size: 22,
              color: "000000"
            }),
          ],
          style: "Normal"
        })
      );

    // Add labels to the Background section if they exist
    if (labels && Object.keys(labels).some(key => labels[key] && labels[key].length > 0)) {
      // Add some spacing before labels
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "", font: "Calibri", size: 22 })],
          style: "Normal",
          spacing: { after: 120 }
        })
      );

      // Add labels paragraphs
      paragraphs.push(...this.createLabelsParagraphs(labels));
    }

    return paragraphs;
  }

  createMetricsParagraphs(metrics) {
    const standardMetrics = [
      { label: "Performance Improvement", value: metrics.performanceImprovement },
      { label: "Cost Reduction", value: metrics.costReduction },
      { label: "Time Savings", value: metrics.timeSavings },
      { label: "User Satisfaction", value: metrics.userSatisfaction }
    ];

    const paragraphs = [];

    // Standard metrics
    standardMetrics
      .filter(metric => metric.value)
      .forEach(metric => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${metric.label}: `,
                font: "Calibri",
                size: 22,
                bold: true,
                color: "000000"
              }),
              new TextRun({
                text: metric.value,
                font: "Calibri",
                size: 22,
                color: "000000"
              }),
            ],
            style: "Normal"
          })
        );
      });

    // Custom metrics
    if (metrics.customMetrics && metrics.customMetrics.length > 0 && metrics.customMetrics.some(m => m.name && m.value)) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Additional Metrics:",
              font: "Calibri",
              size: 24,
              bold: true,
              color: "000000"
            }),
          ],
          style: "Heading2"
        })
      );

      metrics.customMetrics
        .filter(m => m.name && m.value)
        .forEach(metric => {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${metric.name}: `,
                  font: "Calibri",
                  size: 22,
                  bold: true,
                  color: "000000"
                }),
                new TextRun({
                  text: metric.value,
                  font: "Calibri",
                  size: 22,
                  color: "000000"
                }),
              ],
              style: "Normal"
            })
          );
        });
    }

    return paragraphs;
  }

  createLabelsParagraphs(labels) {
    const paragraphs = [];
    
    Object.keys(labels).forEach(category => {
      if (labels[category] && labels[category].length > 0) {
        // Create a single paragraph with category and labels on the same line
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        const labelsList = labels[category].join(', ');
        
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${categoryName}: `,
                font: "Calibri",
                size: 22,
                bold: true,
                color: "000000"
              }),
              new TextRun({
                text: labelsList,
                font: "Calibri",
                size: 22,
                color: "000000"
              }),
            ],
            style: "Normal",
            spacing: {
              after: 120, // Small space after each category line
            }
          })
        );
      }
    });
    
    return paragraphs;
  }

  async createWorkstreamsParagraphs(workstreams, caseStudyFolder) {
    const paragraphs = [];
    
    for (const workstream of workstreams.filter(w => w.name || w.description)) {
      // Workstream name
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: workstream.name || `Workstream ${workstreams.indexOf(workstream) + 1}`,
              font: "Calibri",
              size: 24,
              bold: true,
              color: "000000"
            }),
          ],
          style: "Heading2"
        })
      );

      // Workstream description
      if (workstream.description) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: workstream.description,
                font: "Calibri",
                size: 22,
                color: "000000"
              }),
            ],
            style: "Normal"
          })
        );
      }

      // Workstream diagrams (embedded)
      if (workstream.diagrams && workstream.diagrams.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Associated Diagrams:",
                font: "Calibri",
                size: 22,
                bold: true,
                color: "000000"
              }),
            ],
            style: "Normal",
            spacing: { before: 200, after: 100 }
          })
        );

        for (const diagram of workstream.diagrams) {
          try {
            // Add diagram title
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: diagram.name,
                    font: "Calibri",
                    size: 20,
                    bold: true,
                    color: "000000"
                  }),
                ],
                style: "Normal",
                spacing: { before: 150, after: 50 }
              })
            );

            // Try to embed the image if it's an image file
            if (this.isImageFile(diagram.type)) {
              const imageParagraph = await this.createImageParagraph(diagram, caseStudyFolder);
              if (imageParagraph) {
                paragraphs.push(imageParagraph);
              }
            } else {
              // For non-image files (like PDFs), show a reference
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `📄 ${diagram.name} (${diagram.type})`,
                      font: "Calibri",
                      size: 20,
                      color: "000000",
                      italics: true
                    }),
                  ],
                  style: "Normal"
                })
              );
            }
          } catch (error) {
            console.warn(`Failed to embed workstream diagram ${diagram.name}:`, error);
            // Fallback to text reference
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${diagram.name} (${diagram.type})`,
                    font: "Calibri",
                    size: 20,
                    color: "000000"
                  }),
                ],
                style: "Normal"
              })
            );
          }
        }
      }
    }
    
    return paragraphs;
  }

  async generateOnePagerDocx(questionnaire, labels = {}, caseStudyFolder = '') {
    console.log('Starting one-pager DOCX case study generation...');
    
    try {
      // Extract data from questionnaire structure
      const basicInfo = questionnaire.basicInfo || {};
      const content = questionnaire.content || {};
      const metrics = questionnaire.metrics || {};
      
      // Create header with case study title in right corner
      const header = new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: basicInfo.title || 'Case Study',
                font: "Calibri",
                size: 18,
                color: "000000"
              }),
            ],
            alignment: AlignmentType.RIGHT
          })
        ]
      });

      // Create footer with page number in bottom right corner
      const footer = new Footer({
        children: [
          new Paragraph({
            children: [
              PageNumber.CURRENT
            ],
            alignment: AlignmentType.RIGHT
          })
        ]
      });

      // Create the document with one-pager content and 0.5 inch margins
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 720,    // 0.5 inch = 720 twips
                right: 720,  // 0.5 inch = 720 twips
                bottom: 720, // 0.5 inch = 720 twips
                left: 720,   // 0.5 inch = 720 twips
              },
            },
          },
          headers: {
            default: header,
          },
          footers: {
            default: footer,
          },
          children: [
            // Title with bottom border
            new Paragraph({
              children: [
                new TextRun({
                  text: basicInfo.title || 'Case Study',
                  font: "Calibri",
                  size: 32,
                  bold: true,
                  color: "000000"
                }),
              ],
              alignment: AlignmentType.LEFT,
              spacing: { after: 400 },
              border: {
                bottom: {
                  color: "000000",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
            }),

            // Background Section (Enhanced with labels)
            new Paragraph({
              children: [
                new TextRun({
                  text: "Background",
                  font: "Calibri",
                  size: 24,
                  bold: true,
                  color: "000000"
                }),
              ],
              alignment: AlignmentType.LEFT,
              spacing: { before: 400, after: 200 }
            }),

            ...this.createOnePagerBackgroundParagraphs(basicInfo, labels),

            // Overview Section
            ...(content.overview ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Overview",
                    font: "Calibri",
                    size: 24,
                    bold: true,
                    color: "000000"
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { before: 400, after: 200 }
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: content.overview,
                    font: "Calibri",
                    size: 20,
                    color: "000000"
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 200 }
              })
            ] : []),

            // Challenges Section
            ...(content.challenge ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Challenges",
                    font: "Calibri",
                    size: 24,
                    bold: true,
                    color: "000000"
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { before: 400, after: 200 }
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: content.challenge,
                    font: "Calibri",
                    size: 20,
                    color: "000000"
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 200 }
              })
            ] : []),

            // Solution Section
            ...(content.solution ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Solution",
                    font: "Calibri",
                    size: 24,
                    bold: true,
                    color: "000000"
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { before: 400, after: 200 }
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: content.solution,
                    font: "Calibri",
                    size: 20,
                    color: "000000"
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 200 }
              })
            ] : []),

            // Results Section (includes key metrics)
            new Paragraph({
              children: [
                new TextRun({
                  text: "Results",
                  font: "Calibri",
                  size: 24,
                  bold: true,
                  color: "000000"
                }),
              ],
              alignment: AlignmentType.LEFT,
              spacing: { before: 400, after: 200 }
            }),

            // Results content
            ...(content.results ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: content.results,
                    font: "Calibri",
                    size: 20,
                    color: "000000"
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 200 }
              })
            ] : []),

            // Key Metrics (compact format for one-pager)
            ...this.createOnePagerCompactMetricsParagraphs(metrics)
          ]
        }]
      });

      // Generate and return the document buffer
      const buffer = await Packer.toBuffer(doc);
      console.log('One-pager DOCX case study generation completed successfully');
      return buffer;

    } catch (error) {
      console.error('Error generating one-pager DOCX case study:', error);
      throw new Error(`Failed to generate one-pager case study: ${error.message}`);
    }
  }

  createOnePagerBackgroundParagraphs(basicInfo, labels = {}) {
    const backgroundItems = [
      { label: "Project Duration", value: basicInfo.duration },
      { label: "Team Size", value: basicInfo.teamSize },
      { label: "Point of Contact(s)", value: basicInfo.pointOfContact }
    ];

    const paragraphs = backgroundItems
      .filter(item => item.value)
      .map(item => 
        new Paragraph({
          children: [
            new TextRun({
              text: `${item.label}: `,
              font: "Calibri",
              size: 20,
              bold: true,
              color: "000000"
            }),
            new TextRun({
              text: item.value,
              font: "Calibri",
              size: 20,
              color: "000000"
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 100 }
        })
      );

    // Add labels to the Background section if they exist
    if (labels && Object.keys(labels).some(key => labels[key] && labels[key].length > 0)) {
      // Add some spacing before labels
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "", font: "Calibri", size: 20 })],
          alignment: AlignmentType.LEFT,
          spacing: { after: 100 }
        })
      );

      // Add labels paragraphs
      paragraphs.push(...this.createOnePagerLabelsParagraphs(labels));
    }

    return paragraphs;
  }

  createOnePagerLabelsParagraphs(labels) {
    const paragraphs = [];
    
    Object.keys(labels).forEach(category => {
      if (labels[category] && labels[category].length > 0) {
        // Create a single paragraph with category and labels on the same line
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        const labelsList = labels[category].join(', ');
        
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${categoryName}: `,
                font: "Calibri",
                size: 20,
                bold: true,
                color: "000000"
              }),
              new TextRun({
                text: labelsList,
                font: "Calibri",
                size: 20,
                color: "000000"
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 100 }
          })
        );
      }
    });
    
    return paragraphs;
  }

  createOnePagerCompactMetricsParagraphs(metrics) {
    const standardMetrics = [
      { label: "Performance Improvement", value: metrics.performanceImprovement },
      { label: "Cost Reduction", value: metrics.costReduction },
      { label: "Time Savings", value: metrics.timeSavings },
      { label: "User Satisfaction", value: metrics.userSatisfaction }
    ];

    // Filter out metrics that don't have valid values
    const availableMetrics = standardMetrics.filter(metric => 
      metric.value && 
      metric.value.toString().trim() !== '' && 
      metric.value !== null && 
      metric.value !== undefined
    );
    
    // Filter custom metrics as well
    const validCustomMetrics = (metrics.customMetrics || []).filter(metric => 
      metric && 
      metric.name && 
      metric.value && 
      metric.name.toString().trim() !== '' && 
      metric.value.toString().trim() !== ''
    );
    
    // If no valid metrics at all, don't show the section
    if (availableMetrics.length === 0 && validCustomMetrics.length === 0) {
      return [];
    }

    const paragraphs = [
      new Paragraph({
        children: [
          new TextRun({
            text: "Key Metrics",
            font: "Calibri",
            size: 22,
            bold: true,
            color: "000000"
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { before: 200, after: 150 }
      })
    ];

    // Add standard metrics (only valid ones)
    availableMetrics.forEach(metric => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${metric.label}: `,
              font: "Calibri",
              size: 20,
              bold: true,
              color: "000000"
            }),
            new TextRun({
              text: metric.value.toString(),
              font: "Calibri",
              size: 20,
              color: "000000"
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 100 }
        })
      );
    });

    // Add custom metrics (only valid ones)
    validCustomMetrics.forEach(metric => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${metric.name}: `,
              font: "Calibri",
              size: 20,
              bold: true,
              color: "000000"
            }),
            new TextRun({
              text: metric.value.toString(),
              font: "Calibri",
              size: 20,
              color: "000000"
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 100 }
        })
      );
    });

    return paragraphs;
  }
}

module.exports = new DocxService();
