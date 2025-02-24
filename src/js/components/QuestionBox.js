class QuestionBox {
    constructor(floatingCard, onSubmit) {
        this.floatingCard = floatingCard;
        this.onSubmit = onSubmit;
        this.box = null;
    }

    create() {
        // Get the main card's position
        const mainCardRect = this.floatingCard.card.getBoundingClientRect();
        
        // Create question box
        this.box = document.createElement('div');
        this.box.className = 'article-assistant-question-box';
        this.box.style.cssText = `
            position: fixed;
            top: ${mainCardRect.bottom + 10}px;
            right: ${window.innerWidth - mainCardRect.right}px;
            width: ${mainCardRect.width}px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 16px;
            z-index: 999999;
        `;

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

        // Focus the textarea
        setTimeout(() => textarea.focus(), 100);
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