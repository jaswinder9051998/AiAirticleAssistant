// Question box visibility fix
console.log('[ArticleAssistant] Loading question box visibility fix');

(function() {
    // Global flag to prevent duplicate submissions
    let isSubmitting = false;
    
    // Wait for DOM to be ready
    function waitForQuestionBox(maxAttempts = 30) {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (typeof QuestionBox !== 'undefined') {
                clearInterval(interval);
                console.log('[ArticleAssistant] QuestionBox found, applying fixes');
                applyFixes();
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.error('[ArticleAssistant] QuestionBox not found after', attempts, 'attempts');
            }
        }, 100);
    }
    
    function applyFixes() {
        try {
            // Store original methods
            const originalCreateSubmitButton = QuestionBox.prototype.createSubmitButton;
            const originalGetQuestionInput = QuestionBox.prototype.getQuestionInput;
            
            // Fix the getQuestionInput method if it doesn't exist or is broken
            if (!originalGetQuestionInput) {
                QuestionBox.prototype.getQuestionInput = function() {
                    console.log('[ArticleAssistant] Using fixed getQuestionInput method');
                    if (!this.box) {
                        console.error('[ArticleAssistant] No question box exists for getQuestionInput');
                        return null;
                    }
                    
                    // Find textarea in the box
                    const textarea = this.box.querySelector('textarea');
                    if (!textarea) {
                        console.error('[ArticleAssistant] No textarea found in question box');
                        return null;
                    }
                    
                    return textarea;
                };
            }
            
            // Fix the submit button creation or event handling - but don't add event handlers here
            if (originalCreateSubmitButton) {
                QuestionBox.prototype.createSubmitButton = function(textarea) {
                    console.log('[ArticleAssistant] Using enhanced createSubmitButton method');
                    
                    // Call original method to create the button
                    const submitButton = originalCreateSubmitButton.call(this, textarea);
                    
                    // Don't add event handlers here - we'll do it in the show method
                    // Just make sure the button is returned correctly
                    return submitButton;
                };
            }
            
            // Instead of storing original methods and calling them, we'll completely override
            // the methods and implement the full functionality ourselves
            
            // Override the show method completely
            QuestionBox.prototype.show = function() {
                console.log('[ArticleAssistant] Fixed show() method called');
                
                // First ensure the box exists
                if (!this.box) {
                    console.log('[ArticleAssistant] Box doesn\'t exist, creating it first');
                    this.create();
                }
                
                if (!this.box) {
                    console.error('[ArticleAssistant] Failed to create question box');
                    return;
                }
                
                // Make sure box is in the DOM
                if (!document.body.contains(this.box)) {
                    console.log('[ArticleAssistant] Box not in DOM, appending it');
                    document.body.appendChild(this.box);
                }
                
                // Apply essential styles directly
                const styles = {
                    'position': 'fixed',
                    'display': 'block',
                    'visibility': 'visible',
                    'opacity': '1',
                    'z-index': '2147483647', // Maximum z-index
                    'background-color': '#ffffff',
                    'border': '2px solid #4285f4',
                    'box-shadow': '0 12px 24px rgba(0, 0, 0, 0.3)',
                    'border-radius': '8px',
                    'top': '50%',
                    'left': '50%',
                    'transform': 'translate(-50%, -50%)',
                    'max-width': '450px',
                    'min-width': '300px',
                    'padding': '0',
                    'pointer-events': 'auto'
                };
                
                // Apply each style with !important
                Object.entries(styles).forEach(([property, value]) => {
                    this.box.style.setProperty(property, value, 'important');
                });
                
                // Fix all child elements to ensure they're visible
                const allElements = this.box.querySelectorAll('*');
                allElements.forEach(el => {
                    el.style.setProperty('visibility', 'visible', 'important');
                    el.style.setProperty('opacity', '1', 'important');
                    
                    // Ensure buttons work
                    if (el.tagName === 'BUTTON') {
                        el.style.setProperty('pointer-events', 'auto', 'important');
                        el.style.setProperty('cursor', 'pointer', 'important');
                    }
                });
                
                // Specific fix for the submit button
                const submitButton = this.box.querySelector('button.article-assistant-submit-button, button[type="submit"]');
                if (submitButton) {
                    console.log('[ArticleAssistant] Found submit button, replacing all event handlers');
                    
                    // Clone the button to remove all existing event listeners
                    const newButton = submitButton.cloneNode(true);
                    if (submitButton.parentNode) {
                        submitButton.parentNode.replaceChild(newButton, submitButton);
                    }
                    
                    // Ensure submit button event handlers work by adding a single onclick handler
                    newButton.onclick = (e) => {
                        console.log('[ArticleAssistant] Submit button clicked via onclick handler');
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Prevent duplicate submissions
                        if (isSubmitting) {
                            console.log('[ArticleAssistant] Submission already in progress, ignoring duplicate click');
                            return false;
                        }
                        
                        isSubmitting = true;
                        
                        const textarea = this.getQuestionInput();
                        if (textarea && typeof this.onSubmit === 'function') {
                            const question = textarea.value.trim();
                            if (question) {
                                console.log('[ArticleAssistant] Submitting question:', 
                                          question.substring(0, 50) + (question.length > 50 ? '...' : ''));
                                
                                // Add visual feedback
                                newButton.textContent = 'Submitting...';
                                newButton.disabled = true;
                                
                                try {
                                    this.onSubmit(question);
                                } catch (error) {
                                    console.error('[ArticleAssistant] Error in onSubmit:', error);
                                    // Reset submission state on error
                                    isSubmitting = false;
                                    newButton.textContent = 'Submit';
                                    newButton.disabled = false;
                                }
                                
                                // The question box will be removed by the onSubmit handler
                                // when successful, but let's reset the flag after a timeout
                                // in case it doesn't
                                setTimeout(() => {
                                    isSubmitting = false;
                                }, 5000);
                            } else {
                                console.warn('[ArticleAssistant] Cannot submit empty question');
                                isSubmitting = false;
                            }
                        } else {
                            console.error('[ArticleAssistant] Cannot submit: ' + 
                                         (!textarea ? 'No textarea found' : 'No onSubmit handler'));
                            isSubmitting = false;
                        }
                        
                        return false;
                    };
                } else {
                    console.warn('[ArticleAssistant] No submit button found in question box');
                }
                
                // Log the question box state
                const rect = this.box.getBoundingClientRect();
                console.log('[ArticleAssistant] Question box displayed:', {
                    position: {
                        top: this.box.style.top,
                        left: this.box.style.left
                    },
                    dimensions: {
                        width: rect.width,
                        height: rect.height
                    },
                    styles: {
                        display: this.box.style.display,
                        visibility: this.box.style.visibility,
                        zIndex: this.box.style.zIndex
                    },
                    inDOM: document.body.contains(this.box)
                });
                
                // Verify visibility after a short delay
                setTimeout(() => {
                    if (this.box) {
                        const updatedRect = this.box.getBoundingClientRect();
                        console.log('[ArticleAssistant] Question box visibility check:', {
                            visible: updatedRect.width > 0 && updatedRect.height > 0,
                            dimensions: {
                                width: updatedRect.width,
                                height: updatedRect.height
                            }
                        });
                        
                        // Force visibility again if needed
                        if (updatedRect.width === 0 || updatedRect.height === 0) {
                            console.log('[ArticleAssistant] Re-applying critical styles');
                            Object.entries(styles).forEach(([property, value]) => {
                                this.box.style.setProperty(property, value, 'important');
                            });
                        }
                    }
                }, 100);
            };
            
            // Also improve the create method
            const originalCreate = QuestionBox.prototype.create;
            QuestionBox.prototype.create = function() {
                console.log('[ArticleAssistant] Fixed create() method called');
                
                // Call original create if it exists, or create our own box if it doesn't
                if (typeof originalCreate === 'function') {
                    try {
                        originalCreate.apply(this);
                    } catch (e) {
                        console.error('[ArticleAssistant] Error in original create:', e);
                        // Continue to create our own box
                        this.box = null;
                    }
                }
                
                // If original create failed or doesn't exist, create our own box
                if (!this.box) {
                    // Create a basic box if the original method is missing or failed
                    console.log('[ArticleAssistant] Creating fallback question box');
                    this.box = document.createElement('div');
                    this.box.className = 'article-assistant-question-box';
                    
                    // Create basic structure
                    const header = document.createElement('div');
                    header.style.cssText = 'background: linear-gradient(to right, #1E1E1E, #2D2D2D); padding: 16px 24px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;';
                    
                    const title = document.createElement('div');
                    title.textContent = 'Ask a question about this article';
                    title.style.cssText = 'color: white; font-weight: bold;';
                    
                    const closeBtn = document.createElement('button');
                    closeBtn.textContent = '✕';
                    closeBtn.style.cssText = 'background: none; border: none; color: white; cursor: pointer;';
                    closeBtn.onclick = () => this.remove();
                    
                    header.appendChild(title);
                    header.appendChild(closeBtn);
                    
                    const content = document.createElement('div');
                    content.style.cssText = 'padding: 20px;';
                    
                    const textarea = document.createElement('textarea');
                    textarea.style.cssText = 'width: 100%; min-height: 80px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 15px; font-family: inherit;';
                    textarea.placeholder = 'Type your question here...';
                    
                    const submitBtn = document.createElement('button');
                    submitBtn.textContent = 'Submit';
                    submitBtn.className = 'article-assistant-submit-button';
                    submitBtn.style.cssText = 'background: #4285f4; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;';
                    
                    // We don't add click handler here - we'll do it in the show method
                    // to avoid duplicate event handlers
                    
                    content.appendChild(textarea);
                    content.appendChild(submitBtn);
                    
                    this.box.appendChild(header);
                    this.box.appendChild(content);
                }
                
                // Ensure the box has the correct CSS class
                if (this.box && !this.box.classList.contains('article-assistant-question-box')) {
                    this.box.classList.add('article-assistant-question-box');
                }
                
                // Apply critical styles to ensure visibility
                if (this.box) {
                    const styles = {
                        'position': 'fixed',
                        'display': 'block',
                        'visibility': 'visible',
                        'opacity': '1',
                        'z-index': '2147483647',
                        'background-color': '#ffffff',
                        'border': '2px solid #4285f4',
                        'box-shadow': '0 12px 24px rgba(0, 0, 0, 0.3)',
                        'border-radius': '8px',
                        'top': '50%',
                        'left': '50%',
                        'transform': 'translate(-50%, -50%)',
                        'max-width': '450px',
                        'min-width': '300px',
                        'padding': '0'
                    };
                    
                    // Apply each style with !important
                    Object.entries(styles).forEach(([property, value]) => {
                        this.box.style.setProperty(property, value, 'important');
                    });
                }
                
                return this.box;
            };
            
            // Ensure remove method works properly
            const originalRemove = QuestionBox.prototype.remove;
            QuestionBox.prototype.remove = function() {
                console.log('[ArticleAssistant] Fixed remove() method called');
                
                // Reset submission flag when the box is removed
                isSubmitting = false;
                
                if (this.box) {
                    if (document.body.contains(this.box)) {
                        document.body.removeChild(this.box);
                    }
                    this.box = null;
                }
                
                // Also call original remove if it exists
                if (typeof originalRemove === 'function') {
                    try {
                        originalRemove.apply(this);
                    } catch (e) {
                        console.log('[ArticleAssistant] Error in original remove:', e);
                    }
                }
            };
            
            console.log('[ArticleAssistant] Question box fixes successfully applied');
        } catch (error) {
            console.error('[ArticleAssistant] Error applying QuestionBox fixes:', error);
        }
    }
    
    // Start waiting for QuestionBox
    waitForQuestionBox();
})(); 