<?php
/**
 * Ranking Section 滚动条样式修复
 * 使桌面端的 vertical scrollbar 功能在手机端也能使用
 * 
 * 使用方法：
 * 1. 将此代码添加到 WordPress Code Snippets 插件
 * 2. 激活代码片段
 * 3. 样式将自动应用到 ranking section
 */

function sosomama_ranking_scrollbar_mobile_fix() {
    ?>
    <style>
        /* 桌面端：为 ranking list 添加滚动功能 */
        .sosomama-ranking-list {
            max-height: 500px;
            overflow-y: auto;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
        }
        
        /* 桌面端滚动条样式 */
        .sosomama-ranking-list::-webkit-scrollbar {
            width: 8px;
        }
        
        .sosomama-ranking-list::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
        }
        
        .sosomama-ranking-list::-webkit-scrollbar-thumb {
            background: #4682B4;
            border-radius: 4px;
        }
        
        .sosomama-ranking-list::-webkit-scrollbar-thumb:hover {
            background: #357ABD;
        }
        
        /* Firefox 滚动条样式 */
        .sosomama-ranking-list {
            scrollbar-width: thin;
            scrollbar-color: #4682B4 #f1f1f1;
        }
        
        /* 手机端：确保滚动条可见且可用 */
        @media (max-width: 768px) {
            .sosomama-ranking-list {
                max-height: 400px;
                overflow-y: auto;
                overflow-x: hidden;
                -webkit-overflow-scrolling: touch;
                /* 确保在手机端滚动条可见 */
                -ms-overflow-style: scrollbar; /* IE 和 Edge */
                scrollbar-width: thin; /* Firefox */
            }
            
            /* 手机端滚动条样式 - 稍微粗一点以便触摸 */
            .sosomama-ranking-list::-webkit-scrollbar {
                width: 10px; /* 手机端稍微粗一点，方便触摸 */
            }
            
            .sosomama-ranking-list::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 5px;
            }
            
            .sosomama-ranking-list::-webkit-scrollbar-thumb {
                background: #4682B4;
                border-radius: 5px;
                min-height: 30px; /* 确保滚动条足够大，方便触摸 */
            }
            
            .sosomama-ranking-list::-webkit-scrollbar-thumb:hover {
                background: #357ABD;
            }
            
            .sosomama-ranking-list::-webkit-scrollbar-thumb:active {
                background: #2a5f8f;
            }
            
            /* 确保每个 ranking category group 的列表都可以滚动 */
            .sosomama-ranking-category-group .sosomama-ranking-list {
                max-height: 400px;
                overflow-y: auto;
                overflow-x: hidden;
                -webkit-overflow-scrolling: touch;
            }
        }
        
        /* 小屏幕手机端优化 */
        @media (max-width: 480px) {
            .sosomama-ranking-list {
                max-height: 350px;
            }
            
            .sosomama-ranking-category-group .sosomama-ranking-list {
                max-height: 350px;
            }
        }
    </style>
    <?php
}
add_action('wp_head', 'sosomama_ranking_scrollbar_mobile_fix');

