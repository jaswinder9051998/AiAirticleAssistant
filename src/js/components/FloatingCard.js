class FloatingCard {
    constructor() {
        this.card = null;
        this.isMinimized = false;
        this.isResizing = false;
        this.currentHandle = null;
        this.resizeStart = { x: 0, y: 0, width: 0, height: 0 };
        this.savedSize = null;
    }

    create(summary, points, onAskButtonClick) {
        // Remove existing card if any
        this.remove();

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
    }

    addResizeHandles() {
        const leftHandle = document.createElement('div');
        leftHandle.className = 'article-assistant-resize-handle left';

        const rightHandle = document.createElement('div');
        rightHandle.className = 'article-assistant-resize-handle right';

        // Add resize event listeners
        [leftHandle, rightHandle].forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.isResizing = true;
                this.currentHandle = handle;
                this.resizeStart = {
                    x: e.clientX,
                    width: this.card.offsetWidth,
                    left: this.card.offsetLeft
                };
            });
        });

        // Update the mousemove handler
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        this.card.appendChild(leftHandle);
        this.card.appendChild(rightHandle);
    }

    handleMouseMove(e) {
        if (!this.isResizing) return;
        
        e.preventDefault();
        const deltaX = e.clientX - this.resizeStart.x;
        const isLeft = this.currentHandle.classList.contains('left');

        if (isLeft) {
            const newWidth = Math.max(0, this.resizeStart.width - deltaX);
            const newLeft = this.resizeStart.left + deltaX;
            this.card.style.width = `${newWidth}px`;
            this.card.style.left = `${newLeft}px`;
            this.card.style.right = 'auto';
        } else {
            const newWidth = Math.max(0, this.resizeStart.width + deltaX);
            this.card.style.width = `${newWidth}px`;
            this.card.style.left = `${this.resizeStart.left}px`;
            this.card.style.right = 'auto';
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
            gap: 8px;
            margin-left: auto;
        `;

        const askButton = document.createElement('button');
        askButton.className = 'article-assistant-card-button';
        askButton.innerHTML = '❓';
        askButton.title = 'Ask a Question';

        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'article-assistant-card-button';
        minimizeBtn.innerHTML = '−';
        minimizeBtn.title = 'Minimize';
        minimizeBtn.onclick = () => this.toggleMinimize();

        const closeBtn = document.createElement('button');
        closeBtn.className = 'article-assistant-card-button';
        closeBtn.innerHTML = '×';
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
            padding: 12px 20px;
            background-color: #F8F9FA;
            border-bottom: 1px solid #E5E5E5;
            display: block;
            flex-shrink: 0;
        `;

        const askButton = document.createElement('button');
        askButton.className = 'article-assistant-reveal-question-button';
        askButton.textContent = '✨ Ask a Question About This Article';
        askButton.style.cssText = `
            display: block;
            width: 100%;
            padding: 12px 20px;
            background-color: #1A73E8;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            font-size: 15px;
            cursor: pointer;
            text-align: center;
            position: relative;
            z-index: 10001;
            margin: 0;
        `;
        
        askButton.onclick = onAskButtonClick;
        askSection.appendChild(askButton);

        return askSection;
    }

    createContentWrapper(summary, points) {
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'article-assistant-card-content';

        const content = document.createElement('div');
        content.style.padding = '20px';
        content.style.flexGrow = '1';

        // Add Q&A section
        const qaSection = this.createQASection(summary);
        content.appendChild(qaSection);

        // Add quotes section
        const quotesSection = this.createQuotesSection(points);
        content.appendChild(quotesSection);

        contentWrapper.appendChild(content);
        return contentWrapper;
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
                answer.textContent = parts[1];
                
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
    }

    scrollToHighlight(index) {
        const highlights = document.querySelectorAll('.article-assistant-highlight');
        if (highlights[index]) {
            highlights[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.updateActivePoint(index);
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
        answerEl.textContent = answer;

        qaDiv.appendChild(questionEl);
        qaDiv.appendChild(answerEl);
        customQAContainer.appendChild(qaDiv);

        qaDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

window.FloatingCard = FloatingCard; 