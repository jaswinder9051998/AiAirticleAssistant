class QuestionBox {
    constructor(floatingCard, onSubmit) {
        this.floatingCard = floatingCard;
        this.onSubmit = onSubmit;
        this.box = null;
    }

    create() {
        // Get the main card's position
        const mainCardRect = this.floatingCard.card.getBoundingClientRect();
        
        // Calculate available space below and above the main card
        const spaceBelow = window.innerHeight - mainCardRect.bottom;
        const spaceAbove = mainCardRect.top;
        
        // Create question box
        this.box = document.createElement('div');
        this.box.className = 'article-assistant-question-box';

        // Determine if box should appear above or below based on available space
        const minimumBoxHeight = 200;
        const margin = 10;
        const shouldShowAbove = spaceBelow < minimumBoxHeight && spaceAbove > spaceBelow;

        // Position the box
        if (shouldShowAbove) {
            // When showing above, position from the top instead of bottom
            const maxHeight = Math.min(spaceAbove - margin, 400); // Cap max height
            const topPosition = Math.max(margin, mainCardRect.top - maxHeight - margin);
            
            this.box.style.cssText = `
                position: fixed !important;
                top: ${topPosition}px !important;
                right: ${window.innerWidth - mainCardRect.right}px !important;
                width: ${mainCardRect.width}px !important;
                background: white !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                padding: 16px !important;
                z-index: 999999 !important;
                max-height: ${maxHeight}px !important;
                overflow-y: auto !important;
            `;
        } else {
            const maxHeight = Math.min(window.innerHeight - (mainCardRect.bottom + margin) - margin, 400);
            const topPosition = Math.min(mainCardRect.bottom + margin, window.innerHeight - maxHeight - margin);
            
            this.box.style.cssText = `
                position: fixed !important;
                top: ${topPosition}px !important;
                right: ${window.innerWidth - mainCardRect.right}px !important;
                width: ${mainCardRect.width}px !important;
                background: white !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                padding: 16px !important;
                z-index: 999999 !important;
                max-height: ${maxHeight}px !important;
                overflow-y: auto !important;
            `;
        }

        // Create header
        const header = this.createHeader();
        this.box.appendChild(header);

        // Create textarea
        const textarea = this.createTextarea();
        this.box.appendChild(textarea);

        // Create submit button
        const submitBtn = this.createSubmitButton(textarea);
        this.box.appendChild(submitBtn);

        // Add to page
        document.body.appendChild(this.box);

        // Ensure the box is fully visible
        this.adjustPosition();

        // Add window resize handler
        window.addEventListener('resize', () => this.adjustPosition());

        // Focus the textarea
        setTimeout(() => textarea.focus(), 100);
    }

    adjustPosition() {
        if (!this.box) return;

        const boxRect = this.box.getBoundingClientRect();
        const mainCardRect = this.floatingCard.card.getBoundingClientRect();

        // Ensure the box doesn't extend beyond screen boundaries
        if (boxRect.right > window.innerWidth) {
            this.box.style.right = '10px';
            this.box.style.left = 'auto';
        }

        if (boxRect.bottom > window.innerHeight) {
            const newTop = window.innerHeight - boxRect.height - 10;
            this.box.style.top = `${Math.max(10, newTop)}px`;
        }

        // Ensure minimum width
        const minWidth = 300;
        if (boxRect.width < minWidth) {
            this.box.style.width = `${minWidth}px`;
        }

        // Update max-height based on available space
        const availableHeight = window.innerHeight - boxRect.top - 10;
        this.box.style.maxHeight = `${availableHeight}px`;
    }

    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Ask a Question About This Article';
        title.style.cssText = `
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #202124;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            color: #5f6368;
            cursor: pointer;
            padding: 4px 8px;
        `;
        closeBtn.onclick = () => this.remove();

        header.appendChild(title);
        header.appendChild(closeBtn);
        return header;
    }

    createTextarea() {
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Type your question here...';
        textarea.style.cssText = `
            width: 100%;
            min-height: 100px;
            padding: 12px;
            border: 1px solid #dadce0;
            border-radius: 8px;
            margin-bottom: 12px;
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
            box-sizing: border-box;
        `;
        return textarea;
    }

    createSubmitButton(textarea) {
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Submit Question';
        submitBtn.style.cssText = `
            background-color: #1a73e8;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
        `;

        submitBtn.onclick = async () => {
            const question = textarea.value.trim();
            if (!question) return;

            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;

            try {
                await this.onSubmit(question);
                this.remove();
            } catch (error) {
                console.error('[ArticleAssistant] Error processing question:', error);
                submitBtn.textContent = 'Error - Try Again';
                
                this.showError(error.message || 'Failed to process question. Please try again.', submitBtn);
            } finally {
                submitBtn.disabled = false;
                if (submitBtn.textContent === 'Processing...') {
                    submitBtn.textContent = 'Submit Question';
                }
            }
        };

        return submitBtn;
    }

    showError(message, submitBtn) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.style.cssText = `
            color: #d93025;
            font-size: 14px;
            margin-top: 8px;
            margin-bottom: 8px;
        `;
        errorMsg.textContent = message;
        
        // Remove any existing error message
        const existingError = this.box.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message before the submit button
        submitBtn.parentNode.insertBefore(errorMsg, submitBtn);
    }

    remove() {
        if (this.box && this.box.parentNode) {
            this.box.parentNode.removeChild(this.box);
        }
        this.box = null;
    }
}

window.QuestionBox = QuestionBox; 