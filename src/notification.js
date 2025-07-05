// Adicione esta linha no início para exportar a classe
export class NotificationSystem {
    constructor() {
        this.container = document.getElementById('notification-container');
        this.notifications = [];
    }

    showNotification(type, title, message, duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Ícones para cada tipo de notificação
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="notification-icon ${icons[type]}"></i>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
            <div class="notification-progress">
                <div class="notification-progress-bar"></div>
            </div>
        `;
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.removeNotification(notification));
        
        this.container.appendChild(notification);
        this.notifications.push(notification);
        
        // Remover automaticamente após o tempo definido
        setTimeout(() => {
            if (this.notifications.includes(notification)) {
                this.removeNotification(notification);
            }
        }, duration);
        
        return notification;
    }

    removeNotification(notification) {
        notification.style.transform = 'translateX(120%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
            notification.remove();
        }, 500);
    }

    confirm(title, message, confirmText = "Confirmar", cancelText = "Cancelar") {
        return new Promise((resolve) => {
            const notification = document.createElement('div');
            notification.className = 'notification info confirm';
            
            notification.innerHTML = `
                <i class="notification-icon fas fa-question-circle"></i>
                <div class="notification-content">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                    <div class="confirm-buttons">
                        <button class="btn-confirm">${confirmText}</button>
                        <button class="btn-cancel">${cancelText}</button>
                    </div>
                </div>
                <button class="notification-close">&times;</button>
            `;
            
            const confirmBtn = notification.querySelector('.btn-confirm');
            const cancelBtn = notification.querySelector('.btn-cancel');
            const closeBtn = notification.querySelector('.notification-close');
            
            confirmBtn.addEventListener('click', () => {
                resolve(true);
                this.removeNotification(notification);
            });
            
            cancelBtn.addEventListener('click', () => {
                resolve(false);
                this.removeNotification(notification);
            });
            
            closeBtn.addEventListener('click', () => {
                resolve(false);
                this.removeNotification(notification);
            });
            
            this.container.appendChild(notification);
            this.notifications.push(notification);
        });
    }
}

// Adicione esta linha para exportar uma instância pronta para uso
export const notificationSystem = new NotificationSystem();