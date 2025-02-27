class FloatingCard {
    constructor() {
        this.card = null;
        this.isMinimized = false;
        this.isResizing = false;
        this.currentHandle = null;
        this.resizeStart = { x: 0, y: 0, width: 0, height: 0, top: 0 };
        this.savedSize = null;
        this.selectionTooltip = null;
        this.selectedText = null;
        this.executiveSummary = null;
        this.statisticsSummary = null;
    }

    create(summary, points, onAskButtonClick, executiveSummary, statisticsSummary) {
        // Remove existing card if any
        this.remove();

        // Store the summaries
        this.executiveSummary = executiveSummary;
        this.statisticsSummary = statisticsSummary;

        // Create the card
        this.card = document.createElement('div');
        this.card.className = 'article-assistant-floating-card';

        // Add resize handles
        this.addResizeHandles();

        // Create header
        const header = this.createHeader();
        
        // Create ask section
        const askSection = this.createAskSection(onAskButtonClick);
        
        // Create content wrapper
        const contentWrapper = this.createContentWrapper(summary, points);
        
        // Assemble the card
        this.card.appendChild(header);
        this.card.appendChild(askSection);
        this.card.appendChild(contentWrapper);

        // Add to page
        document.body.appendChild(this.card);
        
        // Setup text selection handler
        this.setupTextSelectionHandler(onAskButtonClick);
    }

    addResizeHandles() {
        const leftHandle = document.createElement('div');
        leftHandle.className = 'article-assistant-resize-handle-left';

        const rightHandle = document.createElement('div');
        rightHandle.className = 'article-assistant-resize-handle-right';

        const topHandle = document.createElement('div');
        topHandle.className = 'article-assistant-resize-handle-top';
        
        const bottomHandle = document.createElement('div');
        bottomHandle.className = 'article-assistant-resize-handle-bottom';

        // Add resize event listeners
        [leftHandle, rightHandle, topHandle, bottomHandle].forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.isResizing = true;
                this.currentHandle = handle;
                this.resizeStart = {
                    x: e.clientX,
                    y: e.clientY,
                    width: this.card.offsetWidth,
                    height: this.card.offsetHeight,
                    left: this.card.offsetLeft,
                    top: this.card.offsetTop
                };
            });
        });

        // Update the mousemove handler
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        this.card.appendChild(leftHandle);
        this.card.appendChild(rightHandle);
        this.card.appendChild(topHandle);
        this.card.appendChild(bottomHandle);
    }

    handleMouseMove(e) {
        if (!this.isResizing) return;
        
        e.preventDefault();
        const deltaX = e.clientX - this.resizeStart.x;
        const deltaY = e.clientY - this.resizeStart.y;
        
        const isLeft = this.currentHandle.classList.contains('article-assistant-resize-handle-left');
        const isRight = this.currentHandle.classList.contains('article-assistant-resize-handle-right');
        const isTop = this.currentHandle.classList.contains('article-assistant-resize-handle-top');
        const isBottom = this.currentHandle.classList.contains('article-assistant-resize-handle-bottom');

        // Handle horizontal resizing
        if (isLeft) {
            const newWidth = Math.max(250, this.resizeStart.width - deltaX);
            const newLeft = this.resizeStart.left + deltaX;
            this.card.style.width = `${newWidth}px`;
            this.card.style.left = `${newLeft}px`;
            this.card.style.right = 'auto';
        } else if (isRight) {
            const newWidth = Math.max(250, this.resizeStart.width + deltaX);
            this.card.style.width = `${newWidth}px`;
            this.card.style.left = `${this.resizeStart.left}px`;
            this.card.style.right = 'auto';
        }

        // Handle vertical resizing
        if (isTop) {
            const newHeight = Math.max(200, this.resizeStart.height - deltaY);
            const newTop = this.resizeStart.top + deltaY;
            this.card.style.height = `${newHeight}px`;
            this.card.style.top = `${newTop}px`;
            this.card.style.bottom = 'auto';
        } else if (isBottom) {
            const newHeight = Math.max(200, this.resizeStart.height + deltaY);
            this.card.style.height = `${newHeight}px`;
            this.card.style.top = `${this.resizeStart.top}px`;
            this.card.style.bottom = 'auto';
        }
    }

    handleMouseUp() {
        if (this.isResizing) {
            this.isResizing = false;
            this.currentHandle = null;
        }
    }

    createHeader() {
        const header = document.createElement('div');
        header.className = 'article-assistant-card-header';
        
        const title = document.createElement('div');
        title.className = 'article-assistant-card-title';
        title.textContent = 'Key Insights';

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            margin-left: auto;
        `;

        const askButton = document.createElement('button');
        askButton.className = 'article-assistant-card-button';
        askButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
        askButton.title = 'Ask a Question';

        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'article-assistant-card-button';
        minimizeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        minimizeBtn.title = 'Minimize';
        minimizeBtn.onclick = () => this.toggleMinimize();

        const closeBtn = document.createElement('button');
        closeBtn.className = 'article-assistant-card-button';
        closeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        closeBtn.title = 'Close';
        closeBtn.onclick = () => this.remove();

        buttonContainer.appendChild(askButton);
        buttonContainer.appendChild(minimizeBtn);
        buttonContainer.appendChild(closeBtn);

        header.appendChild(title);
        header.appendChild(buttonContainer);

        this.addDragHandlers(header);

        return header;
    }

    createAskSection(onAskButtonClick) {
        const askSection = document.createElement('div');
        askSection.style.cssText = `
            padding: 16px 24px;
            background-color: #FAFAFA;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            display: block;
            flex-shrink: 0;
        `;

        const askButton = document.createElement('button');
        askButton.className = 'article-assistant-reveal-question-button';
        askButton.textContent = '✨ Ask a Question About This Article';
        
        askButton.onclick = () => onAskButtonClick();
        askSection.appendChild(askButton);

        return askSection;
    }

    createContentWrapper(summary, points) {
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'article-assistant-card-content';

        const content = document.createElement('div');
        content.style.padding = '20px';
        content.style.flexGrow = '1';

        // Add executive summary section
        const executiveSummarySection = this.createExecutiveSummarySection(summary);
        content.appendChild(executiveSummarySection);

        // Add statistics section
        const statisticsSection = this.createStatisticsSection();
        content.appendChild(statisticsSection);

        // Add Q&A section
        const qaSection = this.createQASection(summary);
        content.appendChild(qaSection);

        // Add quotes section
        const quotesSection = this.createQuotesSection(points);
        content.appendChild(quotesSection);

        contentWrapper.appendChild(content);
        return contentWrapper;
    }

    createExecutiveSummarySection(summary) {
        const executiveSummarySection = document.createElement('div');
        executiveSummarySection.className = 'article-assistant-quotes-section';
        // Remove the top border for the first section
        executiveSummarySection.style.borderTop = 'none';
        executiveSummarySection.style.marginTop = '0';
        
        // Create a title for the executive summary
        const title = document.createElement('h3');
        title.textContent = 'Executive Summary';
        executiveSummarySection.appendChild(title);
        
        // Create a container for the points
        const pointsContainer = document.createElement('div');
        pointsContainer.className = 'article-assistant-executive-summary-points';
        pointsContainer.style.margin = '0';
        pointsContainer.style.padding = '12px 16px';
        pointsContainer.style.backgroundColor = '#f9f9f9';
        pointsContainer.style.borderRadius = '8px';
        pointsContainer.style.border = '1px solid rgba(0, 0, 0, 0.08)';
        
        // Add a direct test to verify styling works
        const testElement = document.createElement('div');
        testElement.style.display = 'none'; // Hide the test element
        testElement.innerHTML = 'Testing <strong>bold</strong> and <em>italic</em> formatting';
        pointsContainer.appendChild(testElement);
        
        // Use only the provided executive summary
        const summaryText = this.executiveSummary ? this.executiveSummary.trim() : "No executive summary available.";
        
        // Debug the raw summary text
        console.log('[ArticleAssistant] Raw executive summary:', summaryText);
        
        // Split the summary into points and process each one
        const points = summaryText.split(/\n+/).filter(point => point.trim());
        
        points.forEach(point => {
            const pointDiv = document.createElement('div');
            pointDiv.className = 'article-assistant-executive-summary-point';
            pointDiv.style.marginBottom = '8px';
            
            // Log the original point for debugging
            console.log('[ArticleAssistant] Processing point:', point);
            
            // First try our parseMarkdown function
            let parsedHtml = this.parseMarkdown(point);
            
            // As a failsafe, if we don't see any <strong> or <em> tags but we have ** or * in the original,
            // manually apply the formatting
            if ((!parsedHtml.includes('<strong>') && point.includes('**')) || 
                (!parsedHtml.includes('<em>') && point.includes('*'))) {
                
                console.log('[ArticleAssistant] Fallback formatting needed');
                // First escape HTML
                let formattedPoint = point
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                
                // Then handle bold formatting manually
                formattedPoint = formattedPoint.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                
                // Then handle italic formatting manually - after bold to avoid conflicts
                formattedPoint = formattedPoint.replace(/\*([^*]+)\*/g, '<em>$1</em>');
                
                parsedHtml = formattedPoint;
            }
            
            // Double-check our result has the expected tags
            const hasBoldTags = parsedHtml.includes('<strong>');
            const hasItalicTags = parsedHtml.includes('<em>');
            console.log('[ArticleAssistant] Formatted HTML contains bold tags:', hasBoldTags);
            console.log('[ArticleAssistant] Formatted HTML contains italic tags:', hasItalicTags);
            
            // Modify to ensure list number style is retained but markdown is processed
            if (point.match(/^\d+\.\s+/)) {
                const numberPart = point.match(/^\d+\.\s+/)[0];
                const contentPart = point.replace(/^\d+\.\s+/, '');
                const processedContent = this.parseMarkdown(contentPart);
                pointDiv.innerHTML = numberPart + processedContent;
            } else {
                // Set the final HTML directly
                pointDiv.innerHTML = parsedHtml;
            }
            
            pointsContainer.appendChild(pointDiv);
        });
        
        executiveSummarySection.appendChild(pointsContainer);
        return executiveSummarySection;
    }

    createQASection(summary) {
        const qaSection = document.createElement('div');
        qaSection.className = 'article-assistant-qa-section';
        
        const qaContent = summary.split('💡 MAIN POINTS')[1] || summary;
        const qaPairs = qaContent.split(/Q:/).filter(pair => pair.trim());
        
        qaPairs.forEach(pair => {
            const qaDiv = document.createElement('div');
            qaDiv.className = 'article-assistant-qa-pair';
            
            const parts = pair.split(/A:/).map(p => p.trim());
            if (parts.length === 2) {
                const question = document.createElement('div');
                question.className = 'article-assistant-question';
                question.textContent = parts[0];
                
                const answer = document.createElement('div');
                answer.className = 'article-assistant-answer';
                // Use Markdown parsing for the answer
                answer.innerHTML = this.parseMarkdown(parts[1]);
                
                qaDiv.appendChild(question);
                qaDiv.appendChild(answer);
                qaSection.appendChild(qaDiv);
            }
        });

        return qaSection;
    }

    createQuotesSection(points) {
        const quotesSection = document.createElement('div');
        quotesSection.className = 'article-assistant-quotes-section';
        
        const title = document.createElement('h3');
        title.textContent = 'Supporting Evidence';
        quotesSection.appendChild(title);
        
        const quotesList = document.createElement('ul');
        quotesList.className = 'article-assistant-points';
        
        points.forEach((point, index) => {
            const li = document.createElement('li');
            li.className = 'article-assistant-point';
            li.textContent = point;
            li.onclick = () => this.scrollToHighlight(index);
            quotesList.appendChild(li);
        });
        
        quotesSection.appendChild(quotesList);
        return quotesSection;
    }

    createStatisticsSection() {
        // Create main container for statistics section
        const statisticsSection = document.createElement('div');
        statisticsSection.className = 'article-assistant-quotes-section';
        statisticsSection.style.borderTop = 'none';
        statisticsSection.style.marginTop = '24px';
        
        // Create a title for the statistics section with same styling as executive summary
        const title = document.createElement('h3');
        title.textContent = 'Key Statistics';
        statisticsSection.appendChild(title);
        
        // Create a container for the statistics with identical styling to executive summary points container
        const statsContainer = document.createElement('div');
        statsContainer.className = 'article-assistant-executive-summary-points';
        statsContainer.style.margin = '0';
        statsContainer.style.padding = '12px 16px';
        statsContainer.style.backgroundColor = '#f9f9f9';
        statsContainer.style.borderRadius = '8px';
        statsContainer.style.border = '1px solid rgba(0, 0, 0, 0.08)';
        
        // Add a hidden test element to verify styling works
        const testElement = document.createElement('div');
        testElement.style.display = 'none';
        testElement.innerHTML = 'Testing <strong>bold</strong> and <em>italic</em> formatting';
        statsContainer.appendChild(testElement);
        
        if (this.statisticsSummary && this.statisticsSummary !== "No specific statistics found in the article.") {
            console.log('[ArticleAssistant] Processing statistics summary:', this.statisticsSummary.substring(0, 100) + '...');
            
            // Split the statistics into points and process each one
            const points = this.statisticsSummary.split(/\n+/).filter(point => point.trim());
            
            // Track which section we're currently in
            let currentSection = "";
            
            points.forEach(point => {
                const pointDiv = document.createElement('div');
                pointDiv.className = 'article-assistant-executive-summary-point';
                pointDiv.style.marginBottom = '8px';
                
                // Special handling for section headers
                if (point.includes('**STATISTICAL TERMS**') || point.includes('**KEY STATISTICS**')) {
                    const header = document.createElement('h4');
                    if (point.includes('STATISTICAL TERMS')) {
                        header.textContent = 'STATISTICAL TERMS';
                        currentSection = "terms";
                    } else {
                        header.textContent = 'KEY STATISTICS';
                        currentSection = "statistics";
                    }
                    header.style.color = '#4285f4';
                    header.style.marginBottom = '12px';
                    header.style.fontWeight = '700';
                    header.style.fontSize = '15px';
                    pointDiv.appendChild(header);
                } else {
                    console.log('[ArticleAssistant] Processing point in section:', currentSection, ':', point.substring(0, 50) + '...');
                    
                    // Special handling for different sections
                    if (currentSection === "terms") {
                        // For terms section, make sure term names are bold
                        if (point.startsWith('•')) {
                            // Extract the term and definition
                            const colonIndex = point.indexOf(':');
                            if (colonIndex > 0) {
                                const fullTerm = point.substring(0, colonIndex).trim();
                                // Extract just the term (without the bullet)
                                const term = fullTerm.startsWith('•') ? fullTerm.substring(1).trim() : fullTerm;
                                const definition = point.substring(colonIndex + 1).trim();
                                
                                console.log('[ArticleAssistant] Extracted term:', term, 'definition:', definition.substring(0, 30) + '...');
                                
                                // Create formatted HTML with the term in bold, with explicit styling to ensure it appears bold
                                pointDiv.innerHTML = '• <strong style="font-weight: 700 !important; color: #000 !important;">' + term + '</strong>: ' + definition;
                            } else {
                                // Fallback to markdown parsing if the format is unexpected
                                console.log('[ArticleAssistant] Term point without colon, using markdown parser');
                                pointDiv.innerHTML = this.parseMarkdown(point);
                            }
                        } else {
                            // Use markdown parsing for other points in this section
                            console.log('[ArticleAssistant] Non-bullet term point, using markdown parser');
                            pointDiv.innerHTML = this.parseMarkdown(point);
                        }
                    } else if (currentSection === "statistics") {
                        // For statistics section, apply markdown parsing then ensure numbers are bold
                        
                        // First apply markdown parsing
                        let parsedHtml = this.parseMarkdown(point);
                        console.log('[ArticleAssistant] After markdown parsing:', parsedHtml);
                        
                        // Check if we need to manually apply more formatting for numbers
                        const boldTagCount = (parsedHtml.match(/<strong>/g) || []).length;
                        console.log('[ArticleAssistant] Bold tag count:', boldTagCount);
                        
                        // Apply additional formatting regardless of bold tag count
                        // Regular expressions for different number formats - making more specific
                        const percentageRegex = /(\d+(\.\d+)?%)/g;
                        const currencyRegex = /(\$\d+(\.\d+)?\s*(billion|trillion|million)?)/g;
                        const decimalRegex = /(\d+\.\d+)/g;
                        
                        // Only match numbers not already within HTML tags
                        const integerRegex = /\b(\d+)\b(?![^<]*>|[^<>]*<\/)/g;
                        
                        // Enhanced debug logging
                        console.log('[ArticleAssistant] Enhancing number formatting');
                        
                        // Apply bold formatting to numbers not already in tags, with inline styles to ensure they appear bold
                        // Handle percentages first (most specific)
                        parsedHtml = parsedHtml.replace(percentageRegex, function(match) {
                            if (!match.includes('<strong>')) {
                                console.log('[ArticleAssistant] Bolding percentage:', match);
                                return '<strong style="font-weight: 700 !important; color: #000 !important;">' + match + '</strong>';
                            }
                            return match;
                        });
                        
                        // Then currencies
                        parsedHtml = parsedHtml.replace(currencyRegex, function(match) {
                            if (!match.includes('<strong>')) {
                                console.log('[ArticleAssistant] Bolding currency:', match);
                                return '<strong style="font-weight: 700 !important; color: #000 !important;">' + match + '</strong>';
                            }
                            return match;
                        });
                        
                        // Then decimals
                        parsedHtml = parsedHtml.replace(decimalRegex, function(match) {
                            if (!match.includes('<strong>')) {
                                console.log('[ArticleAssistant] Bolding decimal:', match);
                                return '<strong style="font-weight: 700 !important; color: #000 !important;">' + match + '</strong>';
                            }
                            return match;
                        });
                        
                        // Then integers (but not inside tags)
                        parsedHtml = parsedHtml.replace(integerRegex, function(match) {
                            console.log('[ArticleAssistant] Bolding integer:', match);
                            return '<strong style="font-weight: 700 !important; color: #000 !important;">' + match + '</strong>';
                        });
                        
                        console.log('[ArticleAssistant] Final formatted HTML:', parsedHtml);
                        pointDiv.innerHTML = parsedHtml;
                    } else {
                        // For any other content, just use markdown parsing
                        pointDiv.innerHTML = this.parseMarkdown(point);
                    }
                }
                
                statsContainer.appendChild(pointDiv);
            });
        } else {
            const noStatsDiv = document.createElement('div');
            noStatsDiv.textContent = "No specific statistics found in the article.";
            noStatsDiv.style.fontStyle = "italic";
            noStatsDiv.style.color = "#666";
            statsContainer.appendChild(noStatsDiv);
        }
        
        statisticsSection.appendChild(statsContainer);
        return statisticsSection;
    }

    addDragHandlers(header) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        
        header.onmousedown = (e) => {
            if (e.target.classList.contains('article-assistant-card-button')) {
                return;
            }
            
            isDragging = true;
            const rect = this.card.getBoundingClientRect();
            
            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;
            
            this.card.style.cursor = 'grabbing';
            e.preventDefault();
        };
        
        document.onmousemove = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            const maxX = window.innerWidth - this.card.offsetWidth;
            const maxY = window.innerHeight - this.card.offsetHeight;
            
            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));
            
            this.card.style.left = currentX + 'px';
            this.card.style.top = currentY + 'px';
        };
        
        document.onmouseup = () => {
            if (!isDragging) return;
            
            isDragging = false;
            this.card.style.cursor = 'default';
        };
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.card.classList.toggle('article-assistant-minimized');
        
        const minimizeBtn = this.card.querySelector('.article-assistant-card-button');
        minimizeBtn.innerHTML = this.isMinimized ? '+' : '−';
        minimizeBtn.title = this.isMinimized ? 'Maximize' : 'Minimize';
        
        if (this.isMinimized) {
            this.savedSize = {
                width: this.card.style.width,
                height: this.card.style.height
            };
            this.card.style.width = 'auto';
            this.card.style.height = 'auto';
        } else if (this.savedSize) {
            this.card.style.width = this.savedSize.width;
            this.card.style.height = this.savedSize.height;
        }
    }

    remove() {
        if (this.card && this.card.parentNode) {
            this.card.parentNode.removeChild(this.card);
        }
        this.card = null;
        
        // Also remove selection tooltip
        this.removeSelectionTooltip();
    }

    scrollToHighlight(index) {
        const highlights = document.querySelectorAll('.article-assistant-highlight');
        if (highlights.length === 0) {
            console.error('[ArticleAssistant] No highlights found in document');
            return;
        }

        const points = this.card.querySelectorAll('.article-assistant-point');
        const clickedQuote = points[index]?.textContent;
        
        if (!clickedQuote) {
            console.error('[ArticleAssistant] Could not find quote at index', index);
            return;
        }
        
        console.log('[ArticleAssistant] Looking for highlight matching quote:', clickedQuote.substring(0, 40) + '...');
        
        // Find all highlights that match this quote
        const matchingHighlights = Array.from(highlights).filter(highlight => {
            // Check using dataset.quote if available
            if (highlight.dataset.quote) {
                return highlight.dataset.quote === clickedQuote;
            }
            // Fallback to comparing text content
            return highlight.textContent === clickedQuote;
        });
        
        if (matchingHighlights.length > 0) {
            // Use the first matching highlight (there could be multiple for the same quote)
            matchingHighlights[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.updateActivePoint(index);
            
            // Apply a temporary visual effect to make the highlight more visible
            const originalBackground = matchingHighlights[0].style.backgroundColor;
            matchingHighlights[0].style.backgroundColor = 'rgba(255, 255, 0, 0.6)';
            matchingHighlights[0].style.transition = 'background-color 0.5s ease';
            
            setTimeout(() => {
                matchingHighlights[0].style.backgroundColor = originalBackground;
            }, 2000);
            
            console.log('[ArticleAssistant] Successfully scrolled to matching highlight');
        } else {
            // If no exact match, try to find a partial match
            console.log('[ArticleAssistant] No exact match found, trying partial matches');
            let bestMatch = null;
            let highestSimilarity = 0;
            
            // Function to compute similarity between two strings
            const similarity = (s1, s2) => {
                const longer = s1.length > s2.length ? s1 : s2;
                const shorter = s1.length > s2.length ? s2 : s1;
                
                if (longer.length === 0) return 1.0;
                
                // Check if the longer string contains the shorter
                if (longer.includes(shorter)) return 0.8;
                
                // Count common words
                const words1 = s1.toLowerCase().split(/\s+/);
                const words2 = s2.toLowerCase().split(/\s+/);
                const commonWords = words1.filter(word => words2.includes(word)).length;
                return commonWords / Math.max(words1.length, words2.length);
            };
            
            // Try to find partial matches
            for (const highlight of highlights) {
                // Skip if this is a partial highlight and there's a full match available
                if (highlight.dataset.partial === 'true' && !matchingHighlights.length) continue;
                
                // Try to compare with the quote
                const highlightText = highlight.dataset.quote || highlight.textContent;
                const sim = similarity(clickedQuote, highlightText);
                
                if (sim > highestSimilarity) {
                    highestSimilarity = sim;
                    bestMatch = highlight;
                }
            }
            
            if (bestMatch && highestSimilarity > 0.3) {
                bestMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                this.updateActivePoint(index);
                
                // Apply a temporary visual effect
                const originalBackground = bestMatch.style.backgroundColor;
                bestMatch.style.backgroundColor = 'rgba(255, 200, 0, 0.6)';
                bestMatch.style.transition = 'background-color 0.5s ease';
                
                setTimeout(() => {
                    bestMatch.style.backgroundColor = originalBackground;
                }, 2000);
                
                console.log('[ArticleAssistant] Scrolled to partial match with similarity:', highestSimilarity);
            } else {
                console.error('[ArticleAssistant] No matching highlight found for quote');
                
                // Default to index-based navigation as fallback
                if (highlights[index]) {
                    highlights[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    this.updateActivePoint(index);
                    console.log('[ArticleAssistant] Falling back to index-based navigation');
                }
            }
        }
    }

    updateActivePoint(activeIndex) {
        const points = this.card.querySelectorAll('.article-assistant-point');
        points.forEach((point, index) => {
            point.classList.toggle('active', index === activeIndex);
        });
    }

    addCustomQA(question, answer) {
        const content = this.card.querySelector('.article-assistant-card-content > div');
        if (!content) {
            console.error('[ArticleAssistant] Could not find card content');
            return;
        }

        let customQAContainer = content.querySelector('.article-assistant-custom-qa-container');
        if (!customQAContainer) {
            customQAContainer = document.createElement('div');
            customQAContainer.className = 'article-assistant-custom-qa-container';
            customQAContainer.style.cssText = `
                margin-top: 24px;
                padding-top: 24px;
                border-top: 1px solid #E5E5E5;
            `;
            content.appendChild(customQAContainer);
        }

        const qaDiv = document.createElement('div');
        qaDiv.className = 'article-assistant-qa-pair';

        const questionEl = document.createElement('div');
        questionEl.className = 'article-assistant-question';
        questionEl.textContent = question;

        const answerEl = document.createElement('div');
        answerEl.className = 'article-assistant-answer';
        
        // Use Markdown parsing for the answer
        answerEl.innerHTML = this.parseMarkdown(answer);

        qaDiv.appendChild(questionEl);
        qaDiv.appendChild(answerEl);
        customQAContainer.appendChild(qaDiv);

        qaDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Simple Markdown parser
    parseMarkdown(text) {
        if (!text) return '';
        
        console.log('[ArticleAssistant] Parsing markdown for text:', text.substring(0, 50) + '...');
        
        // Test regex functionality with a controlled example
        const testStr = "This is a **bold** test and this is *italic* test.";
        const boldTest = testStr.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        const italicTest = boldTest.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        console.log('[ArticleAssistant] RegEx test - Original:', testStr);
        console.log('[ArticleAssistant] RegEx test - After bold:', boldTest);
        console.log('[ArticleAssistant] RegEx test - After italic:', italicTest);
        
        // Escape HTML to prevent XSS
        let parsed = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
            
        // First, handle the formatting in a specific order:
        
        // 1. Extract and temporarily store code blocks to avoid formatting their contents
        const codeBlocks = [];
        parsed = parsed.replace(/```([\s\S]*?)```/g, (match, code) => {
            codeBlocks.push(code);
            return '%%%CODE_BLOCK_' + (codeBlocks.length - 1) + '%%%';
        });
        
        // 2. Handle bold formatting - must be done before italic to avoid conflicts
        parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // 3. Handle italic formatting
        parsed = parsed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Log intermediate results
        console.log('[ArticleAssistant] After bold/italic parsing:', parsed.substring(0, 50) + '...');
        
        // 4. Replace backticks for inline code
        parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // 5. Restore code blocks
        parsed = parsed.replace(/%%%CODE_BLOCK_(\d+)%%%/g, (match, index) => {
            return '<pre><code>' + codeBlocks[index] + '</code></pre>';
        });
        
        // 6. Replace bullet points
        parsed = parsed.replace(/^\s*[\*\-]\s+(.*?)$/gm, '<li>$1</li>');
        
        // 7. Wrap adjacent list items in ul tags
        parsed = parsed.replace(/(<li>.*?<\/li>)(?:\s*\n\s*)?(?=<li>)/g, '$1');
        parsed = parsed.replace(/(?:^|\n)(<li>.*?<\/li>)(?:\s*\n\s*)?(?:<li>.*?<\/li>)*/g, '\n<ul>$&\n</ul>');
        
        // 8. Replace numbered lists
        parsed = parsed.replace(/^\s*(\d+)\.\s+(.*?)$/gm, '<li>$2</li>');
        
        // 9. Replace headers (## Header)
        parsed = parsed.replace(/^##\s+(.*?)$/gm, '<h2>$1</h2>');
        parsed = parsed.replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>');
        
        // 10. Replace paragraphs (lines with a blank line before and after)
        parsed = parsed.replace(/\n\n([^<].*?)\n\n/g, '\n\n<p>$1</p>\n\n');
        
        // 11. Replace single newlines with <br>
        parsed = parsed.replace(/([^>\n])\n([^<])/g, '$1<br>$2');
        
        console.log('[ArticleAssistant] Final parsed markdown result:', parsed.substring(0, 50) + '...');
        
        return parsed;
    }

    setupTextSelectionHandler(onAskButtonClick) {
        // Remove any existing selection tooltip
        this.removeSelectionTooltip();
        
        // Add event listener for text selection
        document.addEventListener('mouseup', (e) => {
            // Don't show tooltip if selection is inside our card
            if (this.card && this.card.contains(e.target)) {
                return;
            }
            
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            // Remove existing tooltip if selection is empty
            if (!selectedText) {
                this.removeSelectionTooltip();
                this.selectedText = null;
                return;
            }
            
            // Store selected text
            this.selectedText = selectedText;
            
            // Create tooltip if it doesn't exist
            if (!this.selectionTooltip) {
                this.createSelectionTooltip(onAskButtonClick);
            }
            
            // Position the tooltip above the selection
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Calculate a better position - slightly to the right of the start of the selection
            // and ensure it stays within the viewport
            const tooltipWidth = this.selectionTooltip.offsetWidth || 40; // Default if not yet rendered
            
            // Position horizontally - 20% from the left of the selection instead of center
            let leftPosition = rect.left + (rect.width * 0.2) - (tooltipWidth / 2);
            
            // Ensure the tooltip doesn't go off-screen to the left
            leftPosition = Math.max(10, leftPosition);
            
            // Ensure the tooltip doesn't go off-screen to the right
            const rightEdge = leftPosition + tooltipWidth;
            if (rightEdge > window.innerWidth - 10) {
                leftPosition = window.innerWidth - tooltipWidth - 10;
            }
            
            // Position vertically - above the selection with a small gap
            const tooltipHeight = this.selectionTooltip.offsetHeight || 30; // Default if not yet rendered
            let topPosition = rect.top - tooltipHeight - 10 + window.scrollY;
            
            // If there's not enough space above, position it below the selection
            if (topPosition < window.scrollY + 10) {
                topPosition = rect.bottom + 10 + window.scrollY;
                
                // Update the tooltip arrow to point upward when positioned below
                this.selectionTooltip.classList.add('tooltip-below');
            } else {
                this.selectionTooltip.classList.remove('tooltip-below');
            }
            
            this.selectionTooltip.style.left = `${leftPosition}px`;
            this.selectionTooltip.style.top = `${topPosition}px`;
            this.selectionTooltip.style.display = 'flex';
            
            console.log('[ArticleAssistant] Positioned tooltip at:', {
                left: leftPosition,
                top: topPosition,
                selectionRect: {
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height
                }
            });
        });
        
        // Hide tooltip when clicking elsewhere
        document.addEventListener('mousedown', (e) => {
            if (this.selectionTooltip && !this.selectionTooltip.contains(e.target)) {
                this.selectionTooltip.style.display = 'none';
            }
        });
    }

    createSelectionTooltip(onAskButtonClick) {
        this.selectionTooltip = document.createElement('div');
        this.selectionTooltip.className = 'article-assistant-selection-tooltip';
        
        const chatButton = document.createElement('button');
        chatButton.className = 'article-assistant-selection-chat-button';
        chatButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
        chatButton.title = 'Ask about this selection';
        
        chatButton.addEventListener('click', () => {
            // Store the selected text in a more persistent way
            const capturedText = this.selectedText;
            console.log('[ArticleAssistant] Captured selected text for question context:', capturedText ? capturedText.substring(0, 50) + '...' : 'none');
            
            // Store the selected text in a global variable for persistence
            window.articleAssistantSelectedText = capturedText;
            
            // Hide the tooltip
            this.selectionTooltip.style.display = 'none';
            
            // If the card is minimized, maximize it first
            if (this.isMinimized) {
                this.toggleMinimize();
            }
            
            // Call the onAskButtonClick with the captured text as context
            if (capturedText) {
                onAskButtonClick(capturedText);
            }
        });
        
        this.selectionTooltip.appendChild(chatButton);
        document.body.appendChild(this.selectionTooltip);
    }

    removeSelectionTooltip() {
        if (this.selectionTooltip && this.selectionTooltip.parentNode) {
            this.selectionTooltip.parentNode.removeChild(this.selectionTooltip);
            this.selectionTooltip = null;
        }
    }
}

window.FloatingCard = FloatingCard; 