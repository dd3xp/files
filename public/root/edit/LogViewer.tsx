import React from 'react';
import { Modal } from 'antd';
import styles from '../../styles/edit/LogViewer.module.css';

interface LogViewerProps {
    visible: boolean;
    onClose: () => void;
    logs: { time: string; content: string; }[];
}

const LogViewer: React.FC<LogViewerProps> = ({ visible, onClose, logs }) => {
    return (
        <Modal
            title="操作日志"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
            styles={{
                mask: { zIndex: 9998 },
                wrapper: { zIndex: 9999 }
            }}
            style={{ top: 20 }}
        >
            <div className={styles.logContainer}>
                {(logs || []).map((log, index) => (
                    <div 
                        key={index} 
                        className={styles.logEntry}
                        style={{
                            color: log.content.includes('修改特性') ? '#00BCD4' :
                                  log.content.includes('添加特性') ? '#4CAF50' :
                                  '#F44336'
                        }}
                    >
                        <div className={styles.logTime}>{log.time}</div>
                        <pre className={styles.logContent}>{log.content}</pre>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

export default LogViewer; 