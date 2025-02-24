import { formatAnswerText } from '../utils/text.js';

export class FloatingCard {
    constructor() {
        this.card = null;
        this.isMinimized = false;
        this.savedSize = null;
        this.resizeObserver = null;
        this.onAskQuestionCallback = null;
        this.customQAContainer = null;
        this.questionInputContainer = null;
    }

    create(summary, points) {
        console.log('[ArticleAssistant] Starting card creation');
        this.remove();

        const card = document.createElement('div');
        card.className = 'article-assistant-floating-card';
        
        // Create header
        const header = this.createHeader();
        console.log('[ArticleAssistant] Header created');
        
        // Create content
        const content = this.createContent(summary, points);
        console.log('[ArticleAssistant] Content created');
        
        // Create a footer for the "Ask a Question" button
        const footer = document.createElement('div');
        footer.className = 'article-assistant-card-footer';
        footer.id = 'article-assistant-card-footer';
        console.log('[ArticleAssistant] Footer element created with class:', footer.className);
        
        // Add a prominent "Ask a Question" button to the footer
        const askButton = document.createElement('button');
        askButton.className = 'article-assistant-reveal-question-button';
        askButton.id = 'article-assistant-reveal-question-button';
        askButton.textContent = '✨ Ask a Question About This Article';
        askButton.onclick = () => {
            console.log('[ArticleAssistant] Footer ask button clicked');
            if (this.onAskButtonClick) {
                console.log('[ArticleAssistant] Calling onAskButtonClick handler');
                this.onAskButtonClick();
            }
        };
        console.log('[ArticleAssistant] Ask button created with class:', askButton.className);
        
        // Add button to footer with explicit styling to ensure visibility
        askButton.style.cssText = `
            display: block !important;
            width: 100% !important;
            padding: 12px 20px !important;
            background-color: #1A73E8 !important;
            color: white !important;
            border: none !important;
            border-radius: 8px !important;
            font-weight: 500 !important;
            font-size: 15px !important;
            cursor: pointer !important;
            text-align: center !important;
            position: relative !important;
            z-index: 10001 !important;
        `;
        
        footer.appendChild(askButton);
        console.log('[ArticleAssistant] Ask button appended to footer');
        
        // Ensure footer is visible with explicit styling
        footer.style.cssText = `
            padding: 12px 20px !important;
            background-color: #F8F9FA !important;
            border-top: 1px solid #E5E5E5 !important;
            display: block !important;
            position: relative !important;
            z-index: 10000 !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
        
        // Add resize handles
        this.addResizeHandles(card);
        
        // Assemble card
        card.appendChild(header);
        console.log('[ArticleAssistant] Header appended to card');
        
        card.appendChild(content);
        console.log('[ArticleAssistant] Content appended to card');
        
        card.appendChild(footer);
        console.log('[ArticleAssistant] Footer appended to card');
        
        // Create question input container but don't add it yet
        this.questionInputContainer = this.createQuestionInput();
        console.log('[ArticleAssistant] Question input container created and stored');
        
        // Log the card structure before adding to DOM
        console.log('[ArticleAssistant] Card structure:', {
            cardChildren: card.childNodes.length,
            hasHeader: !!card.querySelector('.article-assistant-card-header'),
            hasContent: !!card.querySelector('.article-assistant-card-content'),
            hasFooter: !!card.querySelector('.article-assistant-card-footer'),
            hasButton: !!card.querySelector('.article-assistant-reveal-question-button')
        });
        
        document.body.appendChild(card);
        console.log('[ArticleAssistant] Card appended to document body');
        
        // Verify the card is in the DOM
        const cardInDOM = document.querySelector('.article-assistant-floating-card');
        console.log('[ArticleAssistant] Card in DOM:', !!cardInDOM);
        
        // Verify the footer is in the DOM
        const footerInDOM = document.querySelector('.article-assistant-card-footer');
        console.log('[ArticleAssistant] Footer in DOM:', !!footerInDOM);
        
        // Verify the button is in the DOM
        const buttonInDOM = document.querySelector('.article-assistant-reveal-question-button');
        console.log('[ArticleAssistant] Button in DOM:', !!buttonInDOM);
        
        // Check computed styles of footer and button
        if (footerInDOM) {
            const footerStyles = window.getComputedStyle(footerInDOM);
            console.log('[ArticleAssistant] Footer computed styles:', {
                display: footerStyles.display,
                visibility: footerStyles.visibility,
                height: footerStyles.height,
                padding: footerStyles.padding,
                backgroundColor: footerStyles.backgroundColor
            });
        }
        
        if (buttonInDOM) {
            const buttonStyles = window.getComputedStyle(buttonInDOM);
            console.log('[ArticleAssistant] Button computed styles:', {
                display: buttonStyles.display,
                visibility: buttonStyles.visibility,
                width: buttonStyles.width,
                backgroundColor: buttonStyles.backgroundColor,
                color: buttonStyles.color
            });
        }
        
        // Add a direct event listener to the button
        if (buttonInDOM) {
            buttonInDOM.addEventListener('click', () => {
                console.log('[ArticleAssistant] Button clicked directly via event listener');
                this.revealQuestionInput();
            });
        }
        
        this.card = card;
        
        // Add resize observer
        this.setupResizeObserver();
        console.log('[ArticleAssistant] Card creation complete');
        
        // Schedule a check for potential CSS conflicts
        setTimeout(() => this.checkForCSSConflicts(), 500);
        
        // Add a global access point for debugging
        window.articleAssistantCard = this;
        console.log('[ArticleAssistant] Global access point created: window.articleAssistantCard');
        
        // Set up a mutation observer to track changes to the footer and button
        this.setupMutationObserver();
        
        // Check for CSS inheritance issues
        this.checkCSSInheritance();
        
        // Schedule periodic visibility checks
        this.scheduleVisibilityChecks();
        
        // Check for iframe and script conflicts
        this.checkForScriptConflicts();
        
        // Check for shadow DOM issues
        this.checkForShadowDOMIssues();
        
        // Try alternative button approach after a delay
        setTimeout(() => this.tryAlternativeButtonApproach(), 2000);
    }

    createHeader() {
        const header = document.createElement('div');
        header.className = 'article-assistant-card-header';
        
        const title = document.createElement('div');
        title.className = 'article-assistant-card-title';
        title.textContent = 'Key Insights';

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.alignItems = 'center';
        buttonContainer.style.gap = '8px';

        // Create ask question button
        const askButton = document.createElement('button');
        askButton.className = 'article-assistant-card-button';
        askButton.innerHTML = '❓';
        askButton.title = 'Ask a Question';
        askButton.style.cssText = `
            background: none !important;
            border: none !important;
            font-size: 18px !important;
            color: #FFFFFF !important;
            cursor: pointer !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        `;
        askButton.onclick = () => {
            if (this.onAskButtonClick) {
                this.onAskButtonClick();
            }
        };

        // Create minimize button
        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'article-assistant-card-button';
        minimizeBtn.innerHTML = '−';
        minimizeBtn.title = 'Minimize';
        minimizeBtn.onclick = () => this.toggleMinimize();

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'article-assistant-card-button';
        closeBtn.innerHTML = '×';
        closeBtn.title = 'Close';
        closeBtn.style.marginLeft = '8px';
        closeBtn.onclick = () => this.remove();

        buttonContainer.appendChild(askButton);
        buttonContainer.appendChild(minimizeBtn);
        buttonContainer.appendChild(closeBtn);

        header.appendChild(title);
        header.appendChild(buttonContainer);
        
        // Add drag handlers
        this.addDragHandlers(header);
        
        return header;
    }

    createContent(summary, points) {
        const content = document.createElement('div');
        content.className = 'article-assistant-card-content';
        
        // Create Q&A section
        const qaSection = document.createElement('div');
        qaSection.className = 'article-assistant-qa-section';
        
        // Split the summary into Q&A pairs
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
                answer.innerHTML = formatAnswerText(parts[1]);
                
                qaDiv.appendChild(question);
                qaDiv.appendChild(answer);
                qaSection.appendChild(qaDiv);
            }
        });
        
        content.appendChild(qaSection);
        
        // Create container for custom Q&A
        this.customQAContainer = document.createElement('div');
        this.customQAContainer.className = 'article-assistant-custom-qa-container';
        content.appendChild(this.customQAContainer);
        
        // Create quotes section
        const quotesSection = this.createQuotesSection(points);
        content.appendChild(quotesSection);
        
        // Create question input section (initially hidden)
        this.questionInputContainer = this.createQuestionInput();
        this.questionInputContainer.style.display = 'none'; // Initially hidden
        content.appendChild(this.questionInputContainer);
        
        return content;
    }

    createQuestionInput() {
        console.log('[ArticleAssistant] Creating question input');
        
        const container = document.createElement('div');
        container.className = 'article-assistant-question-input-container';
        
        // Set explicit styles to ensure visibility
        container.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
        
        const title = document.createElement('h3');
        title.className = 'article-assistant-question-input-title';
        title.textContent = 'Ask a question about this article';
        
        const textarea = document.createElement('textarea');
        textarea.className = 'article-assistant-question-textarea';
        textarea.placeholder = 'Type your question here...';
        
        const button = document.createElement('button');
        button.className = 'article-assistant-submit-question-button';
        button.textContent = 'Ask Question';
        
        // Set explicit styles for the button
        button.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
        
        button.onclick = () => {
            const question = textarea.value.trim();
            if (question && this.onAskQuestionCallback) {
                button.textContent = 'Processing...';
                button.disabled = true;
                
                this.onAskQuestionCallback(question)
                    .finally(() => {
                        button.textContent = 'Ask Question';
                        button.disabled = false;
                        textarea.value = '';
                    });
            }
        };
        
        container.appendChild(title);
        container.appendChild(textarea);
        container.appendChild(button);
        
        console.log('[ArticleAssistant] Question input created');
        return container;
    }

    addCustomQA(question, answer) {
        console.log('[ArticleAssistant] Adding custom Q&A:', { question, answer });
        
        if (!this.customQAContainer) {
            console.log('[ArticleAssistant] Custom Q&A container not found, creating it');
            this.customQAContainer = document.createElement('div');
            this.customQAContainer.className = 'article-assistant-custom-qa-container';
            
            const content = this.card.querySelector('.article-assistant-card-content');
            if (content) {
                content.appendChild(this.customQAContainer);
                console.log('[ArticleAssistant] Custom Q&A container added to content');
            } else {
                console.error('[ArticleAssistant] Card content not found');
                return;
            }
        }
        
        // Add the Q&A pair
        const qaDiv = document.createElement('div');
        qaDiv.className = 'article-assistant-custom-qa-pair';
        
        const questionEl = document.createElement('div');
        questionEl.className = 'article-assistant-custom-question';
        questionEl.textContent = question;
        
        const answerEl = document.createElement('div');
        answerEl.className = 'article-assistant-custom-answer';
        answerEl.textContent = answer;
        
        qaDiv.appendChild(questionEl);
        qaDiv.appendChild(answerEl);
        
        this.customQAContainer.appendChild(qaDiv);
        console.log('[ArticleAssistant] Q&A pair added to container');
        
        // Hide question input container
        const questionInputContainer = this.card.querySelector('.article-assistant-question-input-container');
        if (questionInputContainer) {
            questionInputContainer.style.display = 'none';
            console.log('[ArticleAssistant] Question input container hidden');
        }
        
        // Find and show footer
        const footer = this.card.querySelector('.article-assistant-card-footer');
        if (footer) {
            console.log('[ArticleAssistant] Footer visibility before showing:', {
                display: window.getComputedStyle(footer).display,
                visibility: window.getComputedStyle(footer).visibility,
                opacity: window.getComputedStyle(footer).opacity
            });
            
            footer.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
            console.log('[ArticleAssistant] Footer display style set to important');
            
            setTimeout(() => {
                const footerStyles = window.getComputedStyle(footer);
                console.log('[ArticleAssistant] Footer visibility after showing:', {
                    display: footerStyles.display,
                    visibility: footerStyles.visibility,
                    opacity: footerStyles.opacity,
                    computedHeight: footerStyles.height,
                    boundingRect: footer.getBoundingClientRect()
                });
            }, 100);
        } else {
            console.error('[ArticleAssistant] Footer not found when trying to show it');
        }
        
        // Scroll to the new Q&A
        qaDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log('[ArticleAssistant] Scrolled to new Q&A');
    }

    createQuotesSection(points) {
        const section = document.createElement('div');
        section.className = 'article-assistant-quotes-section';
        
        const title = document.createElement('h3');
        title.textContent = 'Supporting Evidence';
        section.appendChild(title);
        
        const list = document.createElement('ul');
        list.className = 'article-assistant-points';
        
        points.forEach((point, index) => {
            const li = document.createElement('li');
            li.className = 'article-assistant-point';
            li.textContent = point;
            li.onclick = () => this.onQuoteClick(index);
            list.appendChild(li);
        });
        
        section.appendChild(list);
        return section;
    }

    addResizeHandles(card) {
        const handles = ['left', 'right'];
        handles.forEach(side => {
            const handle = document.createElement('div');
            handle.className = `article-assistant-resize-handle ${side}`;
            
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const startX = e.clientX;
                const startWidth = card.offsetWidth;
                const startRight = window.innerWidth - (card.offsetLeft + card.offsetWidth);
                const startLeft = card.offsetLeft;
                
                const onMouseMove = (moveEvent) => {
                    moveEvent.preventDefault();
                    const delta = moveEvent.clientX - startX;
                    
                    if (side === 'right') {
                        const newWidth = Math.min(Math.max(startWidth + delta, 300), 700);
                        card.style.width = `${newWidth}px`;
                        card.style.left = `${startLeft}px`;
                    } else if (side === 'left') {
                        const newWidth = Math.min(Math.max(startWidth - delta, 300), 700);
                        card.style.width = `${newWidth}px`;
                        card.style.right = `${startRight}px`;
                        card.style.left = 'auto';
                    }
                };
                
                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
            
            card.appendChild(handle);
        });
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
            
            // Keep card within viewport bounds
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

    setupResizeObserver() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        this.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                if (width > 700) {
                    this.card.style.width = '700px';
                }
            }
        });
        
        this.resizeObserver.observe(this.card);
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
        if (this.card) {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
            if (this.card.parentNode) {
                this.card.parentNode.removeChild(this.card);
            }
            this.card = null;
        }
    }

    onQuoteClick(index) {
        if (this.onQuoteClickCallback) {
            this.onQuoteClickCallback(index);
        }
    }

    setQuoteClickHandler(callback) {
        this.onQuoteClickCallback = callback;
    }
    
    setAskQuestionHandler(callback) {
        this.onAskQuestionCallback = callback;
    }

    createQuestionBox() {
        console.log('[ArticleAssistant] Creating separate question box');
        
        const questionBox = document.createElement('div');
        questionBox.className = 'article-assistant-floating-card';
        questionBox.id = 'article-assistant-question-box';
        
        // Position it below the main card
        const mainCardRect = this.card.getBoundingClientRect();
        questionBox.style.cssText = `
            position: fixed !important;
            top: ${mainCardRect.bottom + 20}px !important;
            right: ${window.innerWidth - mainCardRect.right}px !important;
            width: ${mainCardRect.width}px !important;
            background-color: white !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
            z-index: 9999 !important;
            padding: 20px !important;
        `;
        
        // Create title
        const title = document.createElement('h3');
        title.style.cssText = `
            margin: 0 0 16px 0 !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            color: #202124 !important;
        `;
        title.textContent = 'Ask a Question About This Article';
        
        // Create textarea
        const textarea = document.createElement('textarea');
        textarea.className = 'article-assistant-question-textarea';
        textarea.placeholder = 'Type your question here...';
        textarea.style.cssText = `
            width: 100% !important;
            min-height: 80px !important;
            padding: 12px !important;
            border: 1px solid #dadce0 !important;
            border-radius: 8px !important;
            font-family: inherit !important;
            font-size: 14px !important;
            resize: vertical !important;
            margin-bottom: 12px !important;
            box-sizing: border-box !important;
        `;
        
        // Create submit button
        const button = document.createElement('button');
        button.className = 'article-assistant-submit-question-button';
        button.textContent = 'Ask Question';
        button.style.cssText = `
            padding: 10px 16px !important;
            background-color: #1a73e8 !important;
            color: white !important;
            border: none !important;
            border-radius: 6px !important;
            font-weight: 500 !important;
            font-size: 14px !important;
            cursor: pointer !important;
            display: block !important;
        `;
        
        // Add click handler
        button.onclick = () => {
            const question = textarea.value.trim();
            if (question && this.onAskQuestionCallback) {
                button.textContent = 'Processing...';
                button.disabled = true;
                
                this.onAskQuestionCallback(question)
                    .finally(() => {
                        button.textContent = 'Ask Question';
                        button.disabled = false;
                        textarea.value = '';
                        // Remove the question box after successful submission
                        questionBox.remove();
                    });
            }
        };
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            position: absolute !important;
            top: 12px !important;
            right: 12px !important;
            background: none !important;
            border: none !important;
            font-size: 18px !important;
            cursor: pointer !important;
            color: #5f6368 !important;
            padding: 4px 8px !important;
        `;
        closeBtn.textContent = '×';
        closeBtn.onclick = () => questionBox.remove();
        
        // Assemble the box
        questionBox.appendChild(closeBtn);
        questionBox.appendChild(title);
        questionBox.appendChild(textarea);
        questionBox.appendChild(button);
        
        return questionBox;
    }

    revealQuestionInput() {
        console.log('[ArticleAssistant] Attempting to reveal question input');
        
        // Check if question input container exists
        const questionInputContainer = this.card.querySelector('.article-assistant-question-input-container');
        console.log('[ArticleAssistant] Question input container exists:', !!questionInputContainer);

        // Check footer visibility
        const footer = this.card.querySelector('.article-assistant-card-footer');
        console.log('[ArticleAssistant] Footer element exists:', !!footer);
        if (footer) {
            console.log('[ArticleAssistant] Footer visibility state:', {
                display: window.getComputedStyle(footer).display,
                visibility: window.getComputedStyle(footer).visibility,
                opacity: window.getComputedStyle(footer).opacity,
                height: window.getComputedStyle(footer).height
            });
        }

        // Hide footer
        if (footer) {
            footer.style.display = 'none';
            console.log('[ArticleAssistant] Footer hidden');
        }

        // Show question input
        if (questionInputContainer) {
            questionInputContainer.style.display = 'block';
            console.log('[ArticleAssistant] Question input container displayed');
            
            // Focus textarea
            const textarea = questionInputContainer.querySelector('.article-assistant-question-textarea');
            if (textarea) {
                textarea.focus();
                console.log('[ArticleAssistant] Textarea focused');
            } else {
                console.log('[ArticleAssistant] Textarea not found in question input container');
            }
            
            // Scroll to make input visible
            questionInputContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            console.log('[ArticleAssistant] Scrolled to question input container');
        } else {
            console.error('[ArticleAssistant] Question input container not found');
        }
    }

    checkForCSSConflicts() {
        console.log('[ArticleAssistant] Checking for CSS conflicts');
        
        if (!this.card) {
            console.log('[ArticleAssistant] Card not found, cannot check for CSS conflicts');
            return;
        }
        
        // Check if the card is visible
        const cardRect = this.card.getBoundingClientRect();
        console.log('[ArticleAssistant] Card dimensions:', {
            width: cardRect.width,
            height: cardRect.height,
            top: cardRect.top,
            right: cardRect.right,
            bottom: cardRect.bottom,
            left: cardRect.left
        });
        
        // Check if the footer is visible
        const footer = this.card.querySelector('.article-assistant-card-footer');
        if (footer) {
            const footerRect = footer.getBoundingClientRect();
            console.log('[ArticleAssistant] Footer dimensions:', {
                width: footerRect.width,
                height: footerRect.height,
                top: footerRect.top,
                right: footerRect.right,
                bottom: footerRect.bottom,
                left: footerRect.left,
                isVisible: footerRect.height > 0 && footerRect.width > 0
            });
            
            // Check if the footer is within the visible area of the card
            const isFooterWithinCard = 
                footerRect.top >= cardRect.top && 
                footerRect.bottom <= cardRect.bottom &&
                footerRect.left >= cardRect.left &&
                footerRect.right <= cardRect.right;
            
            console.log('[ArticleAssistant] Is footer within visible card area:', isFooterWithinCard);
            
            // Check if there are any elements overlapping the footer
            const overlappingElements = this.getOverlappingElements(footer);
            console.log('[ArticleAssistant] Elements overlapping the footer:', overlappingElements.length);
            
            if (overlappingElements.length > 0) {
                console.log('[ArticleAssistant] First 3 overlapping elements:', 
                    overlappingElements.slice(0, 3).map(el => ({
                        tagName: el.tagName,
                        className: el.className,
                        id: el.id,
                        zIndex: window.getComputedStyle(el).zIndex
                    }))
                );
            }
        } else {
            console.log('[ArticleAssistant] Footer not found in card');
        }
        
        // Check if the button is visible
        const button = this.card.querySelector('.article-assistant-reveal-question-button');
        if (button) {
            const buttonRect = button.getBoundingClientRect();
            console.log('[ArticleAssistant] Button dimensions:', {
                width: buttonRect.width,
                height: buttonRect.height,
                top: buttonRect.top,
                right: buttonRect.right,
                bottom: buttonRect.bottom,
                left: buttonRect.left,
                isVisible: buttonRect.height > 0 && buttonRect.width > 0
            });
        } else {
            console.log('[ArticleAssistant] Button not found in card');
        }
    }
    
    getOverlappingElements(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Get all elements at the center point of our element
        const elements = document.elementsFromPoint(centerX, centerY);
        
        // Filter out our element and its descendants
        return elements.filter(el => {
            return el !== element && !element.contains(el);
        });
    }

    setupMutationObserver() {
        console.log('[ArticleAssistant] Setting up enhanced mutation observer');
        
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        // Create a new mutation observer with enhanced logging
        this.mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                // Log detailed information about each mutation
                const mutationInfo = {
                    type: mutation.type,
                    target: {
                        id: mutation.target.id,
                        className: mutation.target.className,
                        tagName: mutation.target.tagName
                    },
                    addedNodes: Array.from(mutation.addedNodes).map(node => ({
                        id: node.id,
                        className: node.className,
                        tagName: node.tagName
                    })),
                    removedNodes: Array.from(mutation.removedNodes).map(node => ({
                        id: node.id,
                        className: node.className,
                        tagName: node.tagName
                    })),
                    attributeName: mutation.attributeName,
                    oldValue: mutation.oldValue,
                    newValue: mutation.target.getAttribute?.(mutation.attributeName)
                };
                
                console.log('[ArticleAssistant] Mutation detected:', JSON.stringify(mutationInfo, null, 2));
                
                // Specifically track footer and button modifications
                if (mutation.target.id === 'article-assistant-card-footer' || 
                    mutation.target.id === 'article-assistant-reveal-question-button') {
                    console.log('[ArticleAssistant] Critical element modified:', {
                        element: mutation.target.id,
                        currentDisplay: window.getComputedStyle(mutation.target).display,
                        currentVisibility: window.getComputedStyle(mutation.target).visibility,
                        currentOpacity: window.getComputedStyle(mutation.target).opacity,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });
        
        // Start observing with enhanced configuration
        if (this.card) {
            this.mutationObserver.observe(this.card, {
                childList: true,
                attributes: true,
                subtree: true,
                attributeOldValue: true,
                characterData: true,
                attributeFilter: ['style', 'class', 'display', 'visibility', 'opacity']
            });
            
            // Set up periodic style checks
            this.startPeriodicStyleCheck();
        }
    }

    startPeriodicStyleCheck() {
        // Check styles every second for the first 10 seconds
        let checksRemaining = 10;
        
        const checkInterval = setInterval(() => {
            const footer = this.card.querySelector('#article-assistant-card-footer');
            const button = this.card.querySelector('#article-assistant-reveal-question-button');
            
            if (footer && button) {
                const footerStyles = window.getComputedStyle(footer);
                const buttonStyles = window.getComputedStyle(button);
                
                console.log('[ArticleAssistant] Periodic style check:', {
                    timestamp: new Date().toISOString(),
                    checksRemaining,
                    footer: {
                        display: footerStyles.display,
                        visibility: footerStyles.visibility,
                        opacity: footerStyles.opacity,
                        zIndex: footerStyles.zIndex,
                        position: footerStyles.position
                    },
                    button: {
                        display: buttonStyles.display,
                        visibility: buttonStyles.visibility,
                        opacity: buttonStyles.opacity,
                        zIndex: buttonStyles.zIndex,
                        position: buttonStyles.position
                    }
                });
            } else {
                console.warn('[ArticleAssistant] Critical elements missing during periodic check:', {
                    timestamp: new Date().toISOString(),
                    checksRemaining,
                    footerPresent: !!footer,
                    buttonPresent: !!button
                });
            }
            
            checksRemaining--;
            if (checksRemaining <= 0) {
                clearInterval(checkInterval);
            }
        }, 1000);
    }

    checkCSSInheritance() {
        console.log('[ArticleAssistant] Checking CSS inheritance issues');
        
        const footer = this.card?.querySelector('.article-assistant-card-footer');
        const button = this.card?.querySelector('.article-assistant-reveal-question-button');
        
        if (footer) {
            // Check all computed styles that might affect visibility
            const footerStyles = window.getComputedStyle(footer);
            const criticalProperties = [
                'display', 'visibility', 'opacity', 'height', 'max-height',
                'overflow', 'position', 'z-index', 'pointer-events'
            ];
            
            const footerCriticalStyles = {};
            criticalProperties.forEach(prop => {
                footerCriticalStyles[prop] = footerStyles[prop];
            });
            
            console.log('[ArticleAssistant] Footer critical CSS properties:', footerCriticalStyles);
            
            // Check if any parent elements have styles that might hide the footer
            let parent = footer.parentElement;
            let depth = 0;
            while (parent && depth < 5) {
                const parentStyles = window.getComputedStyle(parent);
                const parentCriticalStyles = {};
                criticalProperties.forEach(prop => {
                    parentCriticalStyles[prop] = parentStyles[prop];
                });
                
                console.log(`[ArticleAssistant] Parent (${parent.tagName}${parent.id ? '#' + parent.id : ''}.${parent.className}) critical CSS:`, parentCriticalStyles);
                
                parent = parent.parentElement;
                depth++;
            }
        }
        
        if (button) {
            // Check button styles
            const buttonStyles = window.getComputedStyle(button);
            const criticalProperties = [
                'display', 'visibility', 'opacity', 'height', 'width',
                'position', 'z-index', 'pointer-events'
            ];
            
            const buttonCriticalStyles = {};
            criticalProperties.forEach(prop => {
                buttonCriticalStyles[prop] = buttonStyles[prop];
            });
            
            console.log('[ArticleAssistant] Button critical CSS properties:', buttonCriticalStyles);
        }
    }
    
    scheduleVisibilityChecks() {
        console.log('[ArticleAssistant] Scheduling visibility checks');
        
        // Check visibility immediately after creation
        setTimeout(() => this.checkElementVisibility(), 100);
        
        // Check again after a longer delay
        setTimeout(() => this.checkElementVisibility(), 1000);
        
        // Check again after page might have finished all loading
        setTimeout(() => this.checkElementVisibility(), 3000);
    }
    
    checkElementVisibility() {
        console.log('[ArticleAssistant] Running visibility check');
        
        const footer = document.getElementById('article-assistant-card-footer');
        const button = document.getElementById('article-assistant-reveal-question-button');
        
        if (!footer) {
            console.error('[ArticleAssistant] Footer not found in DOM during visibility check');
        } else {
            const footerRect = footer.getBoundingClientRect();
            const isFooterVisible = footerRect.width > 0 && 
                                   footerRect.height > 0 && 
                                   window.getComputedStyle(footer).display !== 'none' &&
                                   window.getComputedStyle(footer).visibility !== 'hidden';
            
            console.log('[ArticleAssistant] Footer visibility check:', {
                isVisible: isFooterVisible,
                rect: footerRect,
                display: window.getComputedStyle(footer).display,
                visibility: window.getComputedStyle(footer).visibility
            });
        }
        
        if (!button) {
            console.error('[ArticleAssistant] Button not found in DOM during visibility check');
        } else {
            const buttonRect = button.getBoundingClientRect();
            const isButtonVisible = buttonRect.width > 0 && 
                                   buttonRect.height > 0 && 
                                   window.getComputedStyle(button).display !== 'none' &&
                                   window.getComputedStyle(button).visibility !== 'hidden';
            
            console.log('[ArticleAssistant] Button visibility check:', {
                isVisible: isButtonVisible,
                rect: buttonRect,
                display: window.getComputedStyle(button).display,
                visibility: window.getComputedStyle(button).visibility
            });
            
            // Check if button is clickable
            const buttonPosition = {
                x: buttonRect.left + buttonRect.width / 2,
                y: buttonRect.top + buttonRect.height / 2
            };
            
            const elementAtPoint = document.elementFromPoint(buttonPosition.x, buttonPosition.y);
            console.log('[ArticleAssistant] Element at button position:', {
                isButton: elementAtPoint === button,
                elementFound: elementAtPoint ? `${elementAtPoint.tagName}${elementAtPoint.id ? '#' + elementAtPoint.id : ''}.${elementAtPoint.className}` : 'none'
            });
        }
    }

    checkForScriptConflicts() {
        console.log('[ArticleAssistant] Checking for script conflicts');
        
        // Check if we're in an iframe
        try {
            const isInIframe = window !== window.top;
            console.log('[ArticleAssistant] Running in iframe:', isInIframe);
            
            if (isInIframe) {
                console.warn('[ArticleAssistant] Running in iframe may cause visibility issues');
            }
        } catch (e) {
            console.warn('[ArticleAssistant] Error checking iframe status:', e.message);
        }
        
        // Check for conflicting event listeners
        try {
            const button = document.getElementById('article-assistant-reveal-question-button');
            if (button) {
                // Create a test click event
                const testEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                
                // Track if event is prevented
                let isPrevented = false;
                const originalPreventDefault = testEvent.preventDefault;
                testEvent.preventDefault = function() {
                    isPrevented = true;
                    originalPreventDefault.call(this);
                };
                
                // Dispatch test event without actually triggering the click
                const isEventPrevented = !button.dispatchEvent(testEvent);
                
                console.log('[ArticleAssistant] Button click event test:', {
                    isEventPrevented: isEventPrevented || isPrevented,
                    eventPropagationStopped: !testEvent.bubbles
                });
                
                if (isEventPrevented || isPrevented) {
                    console.warn('[ArticleAssistant] Button click events may be intercepted by other handlers');
                }
            }
        } catch (e) {
            console.warn('[ArticleAssistant] Error testing event conflicts:', e.message);
        }
        
        // Check for global JavaScript that might interfere with our UI
        try {
            // Check for common UI frameworks that might conflict
            const potentialConflicts = [
                { name: 'jQuery', check: () => typeof jQuery !== 'undefined' },
                { name: 'React', check: () => typeof React !== 'undefined' },
                { name: 'Angular', check: () => typeof angular !== 'undefined' || document.querySelector('[ng-app]') !== null },
                { name: 'Vue', check: () => typeof Vue !== 'undefined' },
                { name: 'Bootstrap', check: () => typeof bootstrap !== 'undefined' || document.querySelector('.modal-backdrop') !== null },
                { name: 'Material UI', check: () => document.querySelector('.MuiModal-root') !== null }
            ];
            
            const detectedFrameworks = potentialConflicts
                .filter(framework => {
                    try {
                        return framework.check();
                    } catch (e) {
                        return false;
                    }
                })
                .map(framework => framework.name);
            
            console.log('[ArticleAssistant] Detected UI frameworks:', detectedFrameworks.length ? detectedFrameworks : 'None');
            
            if (detectedFrameworks.length > 0) {
                console.warn('[ArticleAssistant] Potential UI framework conflicts detected');
            }
            
            // Check for modal or overlay elements that might be covering our button
            const overlays = Array.from(document.querySelectorAll('.modal, .overlay, .dialog, [role="dialog"], [aria-modal="true"]'))
                .filter(el => {
                    const styles = window.getComputedStyle(el);
                    return styles.display !== 'none' && styles.visibility !== 'hidden';
                });
            
            console.log('[ArticleAssistant] Active overlay elements:', overlays.length ? overlays.map(el => `${el.tagName}.${el.className}`) : 'None');
            
            if (overlays.length > 0) {
                console.warn('[ArticleAssistant] Overlay elements may be covering the button');
            }
        } catch (e) {
            console.warn('[ArticleAssistant] Error checking for script conflicts:', e.message);
        }
    }

    checkForShadowDOMIssues() {
        console.log('[ArticleAssistant] Checking for Shadow DOM issues');
        
        try {
            // Check if our elements are in any shadow DOM
            const footer = document.getElementById('article-assistant-card-footer');
            const button = document.getElementById('article-assistant-reveal-question-button');
            
            if (footer) {
                let node = footer;
                let shadowRoots = [];
                
                while (node) {
                    if (node.shadowRoot) {
                        shadowRoots.push(node);
                    }
                    node = node.parentNode;
                }
                
                console.log('[ArticleAssistant] Footer shadow roots:', shadowRoots.length ? shadowRoots.map(el => el.tagName) : 'None');
            }
            
            if (button) {
                let node = button;
                let shadowRoots = [];
                
                while (node) {
                    if (node.shadowRoot) {
                        shadowRoots.push(node);
                    }
                    node = node.parentNode;
                }
                
                console.log('[ArticleAssistant] Button shadow roots:', shadowRoots.length ? shadowRoots.map(el => el.tagName) : 'None');
            }
            
            // Check if the page uses shadow DOM extensively
            const shadowRootElements = Array.from(document.querySelectorAll('*'))
                .filter(el => el.shadowRoot)
                .map(el => `${el.tagName}.${el.className}`);
            
            console.log('[ArticleAssistant] Page shadow root elements:', shadowRootElements.length ? shadowRootElements : 'None');
            
            if (shadowRootElements.length > 0) {
                console.warn('[ArticleAssistant] Page uses Shadow DOM which might interfere with our elements');
            }
        } catch (e) {
            console.warn('[ArticleAssistant] Error checking for Shadow DOM issues:', e.message);
        }
    }
    
    tryAlternativeButtonApproach() {
        console.log('[ArticleAssistant] Trying alternative button approach');
        
        try {
            // Check if the button is already visible and working
            const existingButton = document.getElementById('article-assistant-reveal-question-button');
            if (existingButton) {
                const buttonRect = existingButton.getBoundingClientRect();
                const isButtonVisible = buttonRect.width > 0 && 
                                       buttonRect.height > 0 && 
                                       window.getComputedStyle(existingButton).display !== 'none' &&
                                       window.getComputedStyle(existingButton).visibility !== 'hidden';
                
                if (isButtonVisible) {
                    console.log('[ArticleAssistant] Existing button is visible, no need for alternative approach');
                    return;
                }
            }
            
            console.log('[ArticleAssistant] Creating alternative button');
            
            // Find the footer
            const footer = document.getElementById('article-assistant-card-footer');
            if (!footer) {
                console.error('[ArticleAssistant] Footer not found, cannot create alternative button');
                return;
            }
            
            // Clear the footer
            footer.innerHTML = '';
            
            // Create a new button with a different approach
            const alternativeButton = document.createElement('button');
            alternativeButton.id = 'article-assistant-alt-button';
            alternativeButton.textContent = '✨ Ask a Question (Alternative)';
            
            // Apply styles directly to the element
            Object.assign(alternativeButton.style, {
                display: 'block',
                width: '100%',
                padding: '12px 20px',
                backgroundColor: '#1A73E8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '15px',
                cursor: 'pointer',
                textAlign: 'center',
                position: 'relative',
                zIndex: '10001'
            });
            
            // Add click handler
            alternativeButton.addEventListener('click', () => {
                console.log('[ArticleAssistant] Alternative button clicked');
                this.revealQuestionInput();
            });
            
            // Add to footer
            footer.appendChild(alternativeButton);
            console.log('[ArticleAssistant] Alternative button added to footer');
            
            // Make sure footer is visible
            Object.assign(footer.style, {
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                padding: '12px 20px',
                backgroundColor: '#F8F9FA',
                borderTop: '1px solid #E5E5E5',
                position: 'relative',
                zIndex: '10000'
            });
            
            // Check if the alternative button is visible
            setTimeout(() => {
                const altButton = document.getElementById('article-assistant-alt-button');
                if (altButton) {
                    const altButtonRect = altButton.getBoundingClientRect();
                    const isAltButtonVisible = altButtonRect.width > 0 && 
                                             altButtonRect.height > 0 && 
                                             window.getComputedStyle(altButton).display !== 'none' &&
                                             window.getComputedStyle(altButton).visibility !== 'hidden';
                    
                    console.log('[ArticleAssistant] Alternative button visibility check:', {
                        isVisible: isAltButtonVisible,
                        rect: altButtonRect,
                        display: window.getComputedStyle(altButton).display,
                        visibility: window.getComputedStyle(altButton).visibility
                    });
                } else {
                    console.error('[ArticleAssistant] Alternative button not found after creation');
                }
            }, 100);
        } catch (e) {
            console.error('[ArticleAssistant] Error creating alternative button:', e.message);
        }
    }
} 