class QuestionBox {
    constructor(floatingCard, onSubmit, selectedText = null) {
        this.floatingCard = floatingCard;
        this.onSubmit = onSubmit;
        this.box = null;
        
        // Check for globally stored selected text if none was passed
        if (!selectedText && window.articleAssistantSelectedText) {
            selectedText = window.articleAssistantSelectedText;
            console.log('[ArticleAssistant] QuestionBox using globally stored selected text:', 
                selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''));
        }
        
        this.selectedText = selectedText;
        
        // Ensure onSubmit is properly bound
        console.log('[ArticleAssistant] QuestionBox constructor - onSubmit type:', typeof this.onSubmit);
        console.log('[ArticleAssistant] QuestionBox constructor - selectedText present:', !!this.selectedText);
    }

    create() {
        // Get the main card's position
        const mainCardRect = this.floatingCard.card.getBoundingClientRect();
        
        // Create question box
        this.box = document.createElement('div');
        this.box.className = 'article-assistant-question-box';

        // Position near the header - either to the right or below the header
        // Get header height (approximating if not available)
        const headerHeight = 60; // Approximate header height
        
        // Calculate position relative to the header
        const headerBottom = mainCardRect.top + headerHeight;
        const margin = 10;
        
        // Determine if we have enough space to position next to the header
        const spaceToRight = window.innerWidth - mainCardRect.right;
        const availableWidth = Math.min(mainCardRect.width, 350); // Cap width at 350px or card width
        
        // If enough horizontal space, position to the right of the card
        // Otherwise position below the header but still in the upper part of the card
        let topPosition, rightPosition, maxHeight;
        
        if (spaceToRight >= availableWidth + margin && mainCardRect.width < window.innerWidth * 0.7) {
            // Position to the right of the card, aligned with the header
            topPosition = Math.max(margin, mainCardRect.top);
            rightPosition = margin;
            maxHeight = Math.min(window.innerHeight - topPosition - margin, 400);
        } else {
            // Position near the top of the card
            topPosition = Math.max(margin, headerBottom + margin);
            rightPosition = window.innerWidth - mainCardRect.right;
            
            // Ensure the box doesn't extend beyond the screen height
            maxHeight = Math.min(window.innerHeight - topPosition - margin, 400);
        }
            
        // Set position and dimensions
        this.box.style.top = `${topPosition}px`;
        this.box.style.right = `${rightPosition}px`;
        this.box.style.width = `${availableWidth}px`;
        this.box.style.maxHeight = `${maxHeight}px`;
        this.box.style.transform = 'translateY(10px)';
        this.box.style.opacity = '0';

        // Create header
        const header = this.createHeader();
        this.box.appendChild(header);

        // Create content wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = `
            padding: 16px 20px 20px !important;
        `;

        // Add selected text context if available
        if (this.selectedText) {
            const contextIndicator = this.createContextIndicator();
            contentWrapper.appendChild(contextIndicator);
        }

        // Create textarea
        const textarea = this.createTextarea();
        contentWrapper.appendChild(textarea);

        // Create submit button
        const submitBtn = this.createSubmitButton(textarea);
        contentWrapper.appendChild(submitBtn);

        this.box.appendChild(contentWrapper);

        // Add to page
        document.body.appendChild(this.box);

        // Ensure the box is fully visible
        this.adjustPosition();

        // Add window resize handler
        window.addEventListener('resize', () => this.adjustPosition());

        // Focus the textarea and trigger animation
        setTimeout(() => {
            textarea.focus();
            this.box.style.transform = 'translateY(0)';
            this.box.style.opacity = '1';
        }, 50);
    }

    adjustPosition() {
        if (!this.box) return;

        const boxRect = this.box.getBoundingClientRect();
        const mainCardRect = this.floatingCard.card.getBoundingClientRect();
        const headerHeight = 60; // Approximate header height
        const margin = 10;

        // Get the optimal position near the header
        const availableWidth = Math.min(350, mainCardRect.width);
        const spaceToRight = window.innerWidth - mainCardRect.right;
        
        // Determine best positioning strategy based on available space
        let topPosition, rightPosition;
        
        if (spaceToRight >= availableWidth + margin && mainCardRect.width < window.innerWidth * 0.7) {
            // Position to the right of the card, aligned with the header
            topPosition = Math.max(margin, mainCardRect.top);
            rightPosition = margin;
        } else {
            // Position near the top of the card
            topPosition = Math.max(margin, mainCardRect.top + headerHeight + margin);
            rightPosition = window.innerWidth - mainCardRect.right;
        }
        
        // Ensure the box stays within screen boundaries
        if (boxRect.right > window.innerWidth - margin) {
            rightPosition = Math.max(margin, rightPosition + (boxRect.right - window.innerWidth + margin));
        }
        
        if (boxRect.left < margin) {
            // If box extends beyond left edge, adjust right position
            const currentLeft = window.innerWidth - boxRect.right;
            rightPosition = Math.max(margin, currentLeft - (margin - boxRect.left));
        }

        // If box extends beyond bottom edge, adjust top position
        if (boxRect.bottom > window.innerHeight - margin) {
            topPosition = Math.max(margin, window.innerHeight - boxRect.height - margin);
        }
        
        // If box extends beyond top edge
        if (boxRect.top < margin) {
            topPosition = margin;
        }

        // Apply the adjusted positions
        this.box.style.top = `${topPosition}px`;
        this.box.style.right = `${rightPosition}px`;
        
        // Ensure minimum width
        const minWidth = 300;
        if (boxRect.width < minWidth) {
            this.box.style.width = `${Math.min(availableWidth, minWidth)}px`;
        }

        // Update max-height based on available space
        const availableHeight = window.innerHeight - topPosition - margin;
        this.box.style.maxHeight = `${Math.min(availableHeight, 400)}px`;
    }

    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 14px 20px !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
            border-radius: 12px 12px 0 0 !important;
            background: #f8f9fa !important;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Ask a Question About This Article';
        title.style.cssText = `
            margin: 0 !important;
            font-size: 15px !important;
            font-weight: 600 !important;
            color: #1a1a1a !important;
            letter-spacing: -0.01em !important;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: none !important;
            border: none !important;
            font-size: 22px !important;
            color: #5f6368 !important;
            cursor: pointer !important;
            padding: 0 !important;
            width: 24px !important;
            height: 24px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 50% !important;
            transition: background-color 0.2s !important;
            line-height: 1 !important;
        `;
        
        // Add hover effect for close button
        closeBtn.onmouseover = () => {
            closeBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        };
        
        closeBtn.onmouseout = () => {
            closeBtn.style.backgroundColor = 'transparent';
        };
        
        closeBtn.onclick = () => this.remove();

        header.appendChild(title);
        header.appendChild(closeBtn);
        return header;
    }

    createTextarea() {
        const textareaWrapper = document.createElement('div');
        textareaWrapper.style.cssText = `
            position: relative !important;
            margin-bottom: 16px !important;
        `;

        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Type your question here...';
        textarea.style.cssText = `
            width: 100% !important;
            min-height: 100px !important;
            padding: 14px !important;
            border: 1px solid #e0e0e0 !important;
            border-radius: 10px !important;
            margin-bottom: 0 !important;
            font-family: inherit !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
            resize: vertical !important;
            box-sizing: border-box !important;
            color: #202124 !important;
            transition: border-color 0.2s, box-shadow 0.2s !important;
            outline: none !important;
        `;
        
        // Add focus effect
        textarea.onfocus = () => {
            textarea.style.borderColor = '#4285f4';
            textarea.style.boxShadow = '0 0 0 2px rgba(66, 133, 244, 0.2)';
        };
        
        textarea.onblur = () => {
            textarea.style.borderColor = '#e0e0e0';
            textarea.style.boxShadow = 'none';
        };

        textareaWrapper.appendChild(textarea);
        return textareaWrapper;
    }

    createContextIndicator() {
        const contextIndicator = document.createElement('div');
        contextIndicator.className = 'article-assistant-context-indicator';
        
        const label = document.createElement('div');
        label.className = 'article-assistant-context-indicator-label';
        label.textContent = 'Using selected text as context:';
        
        const text = document.createElement('div');
        text.className = 'article-assistant-context-indicator-text';
        
        // Truncate text if it's too long
        const maxLength = 150;
        let displayText = this.selectedText;
        if (displayText.length > maxLength) {
            displayText = displayText.substring(0, maxLength) + '...';
        }
        
        text.textContent = displayText;
        
        contextIndicator.appendChild(label);
        contextIndicator.appendChild(text);
        
        return contextIndicator;
    }

    createSubmitButton(textarea) {
        const self = this; // Store reference to this
        
        const btnWrapper = document.createElement('div');
        btnWrapper.style.cssText = `
            display: flex !important;
            justify-content: flex-end !important;
        `;

        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Submit Question';
        submitBtn.className = 'article-assistant-submit-button'; // Add class for easy selection
        submitBtn.style.cssText = `
            background-color: #4285f4 !important;
            color: white !important;
            border: none !important;
            padding: 10px 18px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            transition: background-color 0.2s, transform 0.1s !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12) !important;
            letter-spacing: 0.01em !important;
            position: relative !important;
            z-index: 9999999 !important;
        `;
        
        // Add hover and active effects
        submitBtn.onmouseover = () => {
            submitBtn.style.backgroundColor = '#3b78e7';
            console.log('[ArticleAssistant] Button hover detected');
        };
        
        submitBtn.onmouseout = () => {
            submitBtn.style.backgroundColor = '#4285f4';
        };
        
        submitBtn.onmousedown = () => {
            console.log('[ArticleAssistant] Button mousedown detected');
            submitBtn.style.transform = 'scale(0.98)';
        };
        
        submitBtn.onmouseup = () => {
            submitBtn.style.transform = 'scale(1)';
        };

        // Primary handler
        submitBtn.onclick = function(event) {
            console.log('[ArticleAssistant] Submit button clicked via onclick');
            event.preventDefault();
            event.stopPropagation();
            
            const question = self.getQuestionInput().value.trim();
            console.log('[ArticleAssistant] Question input value:', question);
            
            if (!question) {
                console.log('[ArticleAssistant] Question is empty, not submitting');
                submitBtn.classList.add('error');
                setTimeout(() => submitBtn.classList.remove('error'), 500);
                return;
            }
            
            // Verify onSubmit exists and is a function
            console.log('[ArticleAssistant] Checking onSubmit function:', typeof self.onSubmit);
            if (typeof self.onSubmit !== 'function') {
                console.error('[ArticleAssistant] onSubmit is not a function:', self.onSubmit);
                return;
            }
            
            // Change button to processing state
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;
            submitBtn.style.backgroundColor = '#ccc';
            submitBtn.style.cursor = 'wait';
            submitBtn._processing = true;
            
            try {
                // Get the selected text from either the instance or the global variable
                const contextText = self.selectedText || window.articleAssistantSelectedText;
                
                console.log('[ArticleAssistant] Calling onSubmit function with question:', question);
                // Log the selected text being passed
                console.log('[ArticleAssistant] Passing selected text to onSubmit:', contextText ? 'yes, length: ' + contextText.length : 'no');
                
                // Pass both question and selected text to onSubmit
                const result = self.onSubmit(question, contextText);
                console.log('[ArticleAssistant] onSubmit result:', result);
            } catch (error) {
                console.error('[ArticleAssistant] Error in onSubmit:', error);
                submitBtn.textContent = 'Error';
                submitBtn.style.backgroundColor = '#ff4d4f';
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    submitBtn.textContent = 'Submit';
                    submitBtn.disabled = false;
                    submitBtn.style.backgroundColor = '#1677ff';
                    submitBtn.style.cursor = 'pointer';
                    submitBtn._processing = false;
                }, 2000);
                return;
            }
            
            // Reset button after processing
            setTimeout(() => {
                submitBtn.textContent = 'Submit';
                submitBtn.disabled = false;
                submitBtn.style.backgroundColor = '#1677ff';
                submitBtn.style.cursor = 'pointer';
                submitBtn._processing = false;
            }, 2000);
        };

        // Backup event listener
        submitBtn.addEventListener('click', function(event) {
            console.log('[ArticleAssistant] Submit button clicked via addEventListener');
            
            // If the button is already being processed, don't do anything
            if (submitBtn._processing) {
                console.log('[ArticleAssistant] Button already being processed, skipping backup handler');
                return;
            }
            
            event.preventDefault();
            event.stopPropagation();
            
            const question = self.getQuestionInput().value.trim();
            console.log('[ArticleAssistant] Backup handler - Question input value:', question);
            
            if (!question) {
                console.log('[ArticleAssistant] Backup handler - Question is empty, not submitting');
                return;
            }
            
            // Verify onSubmit exists and is a function
            console.log('[ArticleAssistant] Backup handler - Checking onSubmit function:', typeof self.onSubmit);
            if (typeof self.onSubmit !== 'function') {
                console.error('[ArticleAssistant] Backup handler - onSubmit is not a function:', self.onSubmit);
                return;
            }
            
            // Change button to processing state
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;
            submitBtn.style.backgroundColor = '#ccc';
            submitBtn.style.cursor = 'wait';
            submitBtn._processing = true;
            
            try {
                console.log('[ArticleAssistant] Backup handler - Calling onSubmit function with question:', question);
                const result = self.onSubmit(question, self.selectedText);
                console.log('[ArticleAssistant] Backup handler - onSubmit result:', result);
            } catch (error) {
                console.error('[ArticleAssistant] Backup handler - Error in onSubmit:', error);
            }
            
            // Reset button after processing
            setTimeout(() => {
                submitBtn.textContent = 'Submit';
                submitBtn.disabled = false;
                submitBtn.style.backgroundColor = '#1677ff';
                submitBtn.style.cursor = 'pointer';
                submitBtn._processing = false;
            }, 2000);
        });

        btnWrapper.appendChild(submitBtn);
        return btnWrapper;
    }

    showError(message, container) {
        // Remove any existing error message
        const existingError = this.box.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.style.cssText = `
            color: #ea4335 !important;
            font-size: 13px !important;
            margin-top: 12px !important;
            padding: 10px 12px !important;
            background-color: rgba(234, 67, 53, 0.08) !important;
            border-radius: 6px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            text-align: center !important;
            animation: fadeIn 0.3s ease-out !important;
        `;
        errorMsg.textContent = message;
        
        // Insert error message before the container
        container.parentNode.insertBefore(errorMsg, container.nextSibling);
    }

    remove() {
        if (this.box && this.box.parentNode) {
            this.box.parentNode.removeChild(this.box);
        }
        this.box = null;
    }

    show() {
        console.log('[ArticleAssistant] Showing question box');
        if (!this.box) {
            console.log('[ArticleAssistant] Creating question box first');
            this.create();
        } else {
            console.log('[ArticleAssistant] Question box already exists');
        }
    }

    getQuestionInput() {
        if (!this.box) return null;
        return this.box.querySelector('textarea');
    }
}

window.QuestionBox = QuestionBox; 