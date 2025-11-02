// ==UserScript==
// @name         即梦去水印 - 媒体库版
// @namespace    https://space.bilibili.com/519965290?
// @version      2025-11-02-gallery
// @description  检测页面所有无水印图片和视频，提供媒体库浏览和批量下载
// @author       You
// @match        https://jimeng.jianying.com/ai-tool/generate?type=video
// @match        https://jimeng.jianying.com/ai-tool/generate?type=image
// @match        https://jimeng.jianying.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jianying.com
// @grant        GM_download
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    console.log('===========================================');
    console.log('🎬 即梦去水印脚本（媒体库版）已启动');
    console.log('===========================================');
    console.log('📌 智能扫描模式：');
    console.log('  ✓ 每1秒自动扫描一次');
    console.log('  ✓ 增量更新（只添加新媒体）');
    console.log('  ✓ URL去重（避免重复）');
    console.log('  ✓ 不重置已有媒体（视频图片不会刷新）');
    console.log('  ✓ 性能优化（仅日志按需输出）');
    console.log('🎯 智能过滤：');
    console.log('  ✓ 跳过缩略图（image-BSNsy0等）');
    console.log('  ✓ 跳过记录卡片（data-apm-action属性）');
    console.log('  ✓ 智能分辨率检测（aigc_resize_mark）');
    console.log('    → 保留高分辨率：>=1000x1000 (如4096:4096)');
    console.log('    → 跳过低分辨率：<1000x1000 (如360:360)');
    console.log('  ✓ 跳过小图标（<100x100px）');
    console.log('  ✓ 只保留完整大图和视频');
    console.log('🌟 高清标识：');
    console.log('  ✓ 自动识别dreamina-sign域名的高清资源');
    console.log('  ✓ 高清资源显示特殊标签和动态效果');
    console.log('📚 操作方式：');
    console.log('  • 自动检测新媒体并添加');
    console.log('  • 点击媒体库按钮查看所有媒体');
    console.log('  • 点击清空按钮清除记录');
    console.log('===========================================');

    // 存储所有找到的媒体
    let allMedia = [];

    // 添加自定义样式
    const style = document.createElement('style');
    style.textContent = `
        .watermark-remover-btn {
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            z-index: 10000;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 15px 25px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            display: none;
        }
        .watermark-remover-btn:hover {
            transform: translateY(-50%) scale(1.05);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        .watermark-remover-btn.show {
            display: block;
        }
        .watermark-info {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 12px;
            display: none;
        }
        .watermark-info.show {
            display: block;
        }
        
        /* 媒体库弹窗样式 */
        .media-gallery-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 20000;
            animation: fadeIn 0.3s ease;
        }
        .media-gallery-modal.show {
            display: block;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .gallery-container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            padding: 20px;
            box-sizing: border-box;
        }
        .gallery-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: #1a1a1a;
            border-radius: 12px;
            margin-bottom: 20px;
        }
        .gallery-title {
            font-size: 24px;
            font-weight: bold;
            color: white;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .gallery-stats {
            color: #888;
            font-size: 14px;
            margin-left: 15px;
        }
        .gallery-actions {
            display: flex;
            gap: 10px;
        }
        .gallery-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .gallery-btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .gallery-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .gallery-btn-close {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 20px;
            width: 40px;
            height: 40px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .gallery-btn-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        .gallery-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .gallery-content {
            flex: 1;
            overflow-y: auto;
            background: #1a1a1a;
            border-radius: 12px;
            padding: 20px;
        }
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        }
        .gallery-item {
            position: relative;
            aspect-ratio: 9/16;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.3s ease;
            background: #000;
        }
        .gallery-item:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.5);
        }
        .gallery-item:hover .gallery-item-play-icon {
            background: rgba(102, 126, 234, 0.9);
        }
        .gallery-item-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .gallery-item-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            pointer-events: none;
        }
        .gallery-item-play-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 50px;
            height: 50px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            pointer-events: none;
        }
        .gallery-item-type {
            position: absolute;
            top: 8px;
            left: 8px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .gallery-item-hd-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(245, 87, 108, 0.4);
            animation: hdPulse 2s ease-in-out infinite;
        }
        @keyframes hdPulse {
            0%, 100% { box-shadow: 0 2px 8px rgba(245, 87, 108, 0.4); }
            50% { box-shadow: 0 2px 12px rgba(245, 87, 108, 0.6); }
        }
        .gallery-item-actions {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
            padding: 30px 8px 8px 8px;
            display: flex;
            gap: 5px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .gallery-item:hover .gallery-item-actions {
            opacity: 1;
        }
        .gallery-item-btn {
            flex: 1;
            padding: 6px;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            transition: all 0.3s ease;
        }
        .gallery-item-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        /* 预览弹窗 */
        .preview-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 21000;
            justify-content: center;
            align-items: center;
        }
        .preview-modal.show {
            display: flex;
        }
        .preview-container {
            background: #1a1a1a;
            border-radius: 20px;
            padding: 30px;
            width: 90vw;
            max-width: 1200px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            gap: 20px;
            overflow-y: auto;
        }
        .preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: white;
        }
        .preview-title {
            font-size: 20px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .preview-close {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            font-size: 24px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .preview-close:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: rotate(90deg);
        }
        .preview-content {
            width: 100%;
            min-height: 300px;
            max-height: 70vh;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #000;
        }
        .preview-content video,
        .preview-content img {
            width: 100%;
            height: auto;
            max-height: 70vh;
            border-radius: 12px;
            object-fit: contain;
        }
        .preview-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        .preview-btn {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .preview-download-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .preview-download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .preview-copy-btn {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
        }
        .preview-copy-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(240, 147, 251, 0.4);
        }
        .preview-link {
            color: #667eea;
            text-decoration: underline;
            cursor: pointer;
            margin-top: 10px;
            font-size: 12px;
            text-align: center;
        }
        .preview-info {
            color: #888;
            font-size: 12px;
            text-align: center;
        }
    `;
    document.head.appendChild(style);

    // 创建浮动按钮
    const floatBtn = document.createElement('button');
    floatBtn.className = 'watermark-remover-btn';
    floatBtn.innerHTML = '📚 媒体库 (0)';
    document.body.appendChild(floatBtn);

    // 创建信息提示
    const infoDiv = document.createElement('div');
    infoDiv.className = 'watermark-info';
    infoDiv.textContent = '✅ 已找到媒体';
    document.body.appendChild(infoDiv);

    // 创建媒体库弹窗
    const galleryModal = document.createElement('div');
    galleryModal.className = 'media-gallery-modal';
    galleryModal.innerHTML = `
        <div class="gallery-container">
            <div class="gallery-header">
                <div>
                    <div class="gallery-title">
                        📚 媒体库
                        <span class="gallery-stats">共 <span id="media-count">0</span> 项</span>
                    </div>
                </div>
                <div class="gallery-actions">
                    <button class="gallery-btn gallery-btn-primary" id="batch-download-btn">
                        📥 批量下载
                    </button>
                    <button class="gallery-btn gallery-btn-primary" id="refresh-btn">
                        🔄 刷新
                    </button>
                    <button class="gallery-btn gallery-btn-primary" id="clear-btn" style="background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);">
                        🗑️ 清空
                    </button>
                    <button class="gallery-btn gallery-btn-close" id="close-gallery-btn">
                        ×
                    </button>
                </div>
            </div>
            <div class="gallery-content">
                <div class="gallery-grid" id="media-grid"></div>
            </div>
        </div>
    `;
    document.body.appendChild(galleryModal);

    // 创建预览弹窗
    const previewModal = document.createElement('div');
    previewModal.className = 'preview-modal';
    previewModal.innerHTML = `
        <div class="preview-container">
            <div class="preview-header">
                <div class="preview-title">🖼️ 预览</div>
                <button class="preview-close">×</button>
            </div>
            <div class="preview-content"></div>
            <div class="preview-actions">
                <button class="preview-btn preview-download-btn">📥 下载</button>
                <button class="preview-btn preview-copy-btn">🔗 复制链接</button>
            </div>
            <div class="preview-info">提示：媒体为无水印版本</div>
            <div class="preview-link" style="display: none;">
                <a href="#" target="_blank">🔗 在新标签页中打开</a>
            </div>
        </div>
    `;
    document.body.appendChild(previewModal);

    // 获取元素
    const mediaGrid = document.getElementById('media-grid');
    const mediaCountSpan = document.getElementById('media-count');
    const closeGalleryBtn = document.getElementById('close-gallery-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const clearBtn = document.getElementById('clear-btn');
    const batchDownloadBtn = document.getElementById('batch-download-btn');
    const previewCloseBtn = previewModal.querySelector('.preview-close');
    const previewDownloadBtn = previewModal.querySelector('.preview-download-btn');
    const previewCopyBtn = previewModal.querySelector('.preview-copy-btn');
    const previewContent = previewModal.querySelector('.preview-content');
    const previewLink = previewModal.querySelector('.preview-link');

    let currentPreviewMedia = null;

    // 扫描页面中的所有媒体（增量更新，不重置已有媒体）
    function scanAllMedia() {
        const startTime = Date.now();
        
        // 创建已有媒体URL的Set，用于快速查找
        const existingUrls = new Set(allMedia.map(m => m.url));
        
        let newMediaCount = 0;
        const newMedia = [];

        // 1. 扫描所有视频
        const videos = document.querySelectorAll('video');
        
        videos.forEach((video) => {
            if (video.src && 
                video.src.includes('http') && 
                !existingUrls.has(video.src)) {
                
                // 检测是否为高清来源（dreamina-sign域名）
                const isHD = video.src.includes('dreamina-sign.byteimg.com');
                
                newMedia.push({
                    type: 'video',
                    url: video.src,
                    element: video,
                    index: allMedia.length + newMedia.length,
                    thumbnail: video.poster || video.src,
                    isHD: isHD
                });
                existingUrls.add(video.src);
                newMediaCount++;
            }
        });

        // 2. 扫描所有图片（过滤小图标和特定class的图片）
        const images = document.querySelectorAll('img');
        
        // 需要跳过的class列表（缩略图、参考图等）
        const skipClasses = [
            'image-BSNsy0',      // 参考图/缩略图
            'video-skeleton-img', // 视频封面图
            'reference',         // 参考图
            'thumbnail',         // 缩略图
            'icon',              // 图标
            'avatar',            // 头像
            'logo'               // Logo
        ];
        
        let skippedCount = 0;
        let smallImgCount = 0;
        let lowResCount = 0; // 低分辨率计数
        
        images.forEach((img) => {
            // 检查是否包含需要跳过的class
            const shouldSkip = skipClasses.some(skipClass => 
                img.classList.contains(skipClass) || 
                img.className.includes(skipClass)
            );
            
            if (shouldSkip) {
                skippedCount++;
                return; // 跳过这个图片
            }
            
            // 检查是否有 data-apm-action 属性（记录卡片缩略图等）
            if (img.hasAttribute('data-apm-action')) {
                skippedCount++;
                return; // 跳过带有记录属性的图片
            }
            
            // 检查URL中的分辨率标记（aigc_resize_mark）
            // 例如：aigc_resize_mark:360:360 (低分辨率) vs aigc_resize_mark:4096:4096 (高分辨率)
            if (img.src.includes('aigc_resize_mark:')) {
                const resizeMatch = img.src.match(/aigc_resize_mark:(\d+):(\d+)/);
                if (resizeMatch) {
                    const width = parseInt(resizeMatch[1]);
                    const height = parseInt(resizeMatch[2]);
                    
                    // 跳过低分辨率图片（小于1000x1000的）
                    if (width < 1000 || height < 1000) {
                        lowResCount++;
                        return; // 跳过低分辨率缩略图
                    }
                }
            }
            
            // 检查尺寸
            if (img.naturalWidth <= 100 || img.naturalHeight <= 100) {
                smallImgCount++;
                return; // 跳过小图标
            }
            
            if (img.src && 
                img.src.includes('http') && 
                !existingUrls.has(img.src)) {
                
                // 检测是否为高清来源（dreamina-sign域名）
                const isHD = img.src.includes('dreamina-sign.byteimg.com');
                
                newMedia.push({
                    type: 'image',
                    url: img.src,
                    element: img,
                    index: allMedia.length + newMedia.length,
                    thumbnail: img.src,
                    isHD: isHD
                });
                existingUrls.add(img.src);
                newMediaCount++;
            }
        });
        
        // 首次扫描时输出统计信息
        if (scanCount === 0 && (skippedCount > 0 || smallImgCount > 0 || lowResCount > 0)) {
            console.log(`📊 图片过滤统计：`);
            console.log(`  • 总图片: ${images.length} 个`);
            console.log(`  • 跳过缩略图/参考图: ${skippedCount} 个`);
            console.log(`  • 跳过低分辨率 (<1000x1000): ${lowResCount} 个`);
            console.log(`  • 跳过小图标 (<100x100): ${smallImgCount} 个`);
            console.log(`  • ✅ 保留高清大图: ${newMedia.filter(m => m.type === 'image').length} 个`);
        }

        // 只有发现新媒体时才更新
        if (newMediaCount > 0) {
            const hdCount = newMedia.filter(m => m.isHD).length;
            console.log(`🆕 发现 ${newMediaCount} 个新媒体${hdCount > 0 ? ` (其中 ${hdCount} 个高清)` : ''}`);
            allMedia.push(...newMedia);
            
            // 增量添加到UI，而不是重新渲染所有媒体
            appendNewMediaToUI(newMedia);
            
            // 更新计数
            updateMediaCount();
            
            const scanTime = Date.now() - startTime;
            const totalHD = allMedia.filter(m => m.isHD).length;
            console.log(`✓ 总计: ${allMedia.length} 个媒体 (${totalHD} 个高清)，耗时: ${scanTime}ms`);
        }

        return newMediaCount;
    }

    // 增量添加新媒体到UI（不影响已有媒体）
    function appendNewMediaToUI(newMedia) {
        newMedia.forEach((media) => {
            const item = createMediaItem(media);
            mediaGrid.appendChild(item);
        });
    }

    // 创建单个媒体项
    function createMediaItem(media) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.dataset.index = media.index;
        item.dataset.url = media.url; // 添加URL作为标识

        if (media.type === 'video') {
            item.innerHTML = `
                <video class="gallery-item-video" src="${media.url}" preload="metadata" muted></video>
                <div class="gallery-item-play-icon">▶</div>
                <div class="gallery-item-type">🎬 视频</div>
                ${media.isHD ? '<div class="gallery-item-hd-badge">🌟 高清</div>' : ''}
                <div class="gallery-item-actions">
                    <button class="gallery-item-btn preview-btn" data-action="preview">预览</button>
                    <button class="gallery-item-btn download-btn" data-action="download">下载</button>
                </div>
            `;
            
            // 只加载视频的第一帧作为预览，不自动播放
            const video = item.querySelector('video');
            video.addEventListener('loadedmetadata', () => {
                video.currentTime = 0.1;
            });

            // 可选：鼠标悬停时播放预览（需要长按1秒）
            let hoverTimer = null;
            item.addEventListener('mouseenter', () => {
                hoverTimer = setTimeout(() => {
                    if (video.paused) {
                        video.play().catch(e => console.log('视频播放失败', e));
                    }
                }, 1000);
            });
            
            item.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimer);
                if (!video.paused) {
                    video.pause();
                    video.currentTime = 0.1;
                }
            });
        } else {
            item.innerHTML = `
                <img class="gallery-item-img" src="${media.url}" alt="图片" crossorigin="anonymous">
                <div class="gallery-item-type">🖼️ 图片</div>
                ${media.isHD ? '<div class="gallery-item-hd-badge">🌟 高清</div>' : ''}
                <div class="gallery-item-actions">
                    <button class="gallery-item-btn preview-btn" data-action="preview">预览</button>
                    <button class="gallery-item-btn download-btn" data-action="download">下载</button>
                </div>
            `;
        }

        return item;
    }

    // 只更新媒体计数
    function updateMediaCount() {
        const count = allMedia.length;
        floatBtn.innerHTML = `📚 媒体库 (${count})`;
        mediaCountSpan.textContent = count;

        if (count > 0) {
            floatBtn.classList.add('show');
        }
    }

    // 更新UI（完全重建，用于清空操作）
    function updateUI() {
        const count = allMedia.length;
        floatBtn.innerHTML = `📚 媒体库 (${count})`;
        mediaCountSpan.textContent = count;

        if (count > 0) {
            floatBtn.classList.add('show');
        }

        renderGallery();
    }

    // 渲染媒体库（完全重建，仅用于清空等特殊情况）
    function renderGallery() {
        mediaGrid.innerHTML = '';

        if (allMedia.length === 0) {
            mediaGrid.innerHTML = '<div style="color: #888; text-align: center; padding: 40px;">暂无媒体，等待自动扫描...</div>';
            return;
        }

        allMedia.forEach((media) => {
            const item = createMediaItem(media);
            mediaGrid.appendChild(item);
        });
    }

    // 预览媒体
    function previewMedia(index) {
        console.log('预览媒体，索引:', index);
        const media = allMedia[index];
        if (!media) {
            console.error('未找到媒体，索引:', index);
            return;
        }

        currentPreviewMedia = media;
        previewContent.innerHTML = '';
        previewLink.style.display = 'none';

        if (media.type === 'video') {
            const video = document.createElement('video');
            video.src = media.url;
            video.controls = true;
            video.autoplay = true;
            video.loop = true;
            previewContent.appendChild(video);
            
            console.log('预览视频:', media.url);
        } else {
            const img = document.createElement('img');
            img.src = media.url;
            img.alt = '预览图片';
            img.crossOrigin = 'anonymous';
            previewContent.appendChild(img);

            // 显示新标签页链接
            previewLink.style.display = 'block';
            const link = previewLink.querySelector('a');
            link.href = media.url;
            
            console.log('预览图片:', media.url);
        }

        previewModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // 下载媒体
    function downloadMedia(index) {
        console.log('下载媒体，索引:', index);
        const media = allMedia[index];
        if (!media) {
            console.error('未找到媒体，索引:', index);
            return;
        }

        const timestamp = new Date().getTime();
        let filename;

        if (media.type === 'image') {
            const urlExt = media.url.split('.').pop().split('?')[0];
            const ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(urlExt.toLowerCase()) ? urlExt : 'jpg';
            filename = `jimeng_image_${timestamp}.${ext}`;
        } else {
            filename = `jimeng_video_${timestamp}.mp4`;
        }

        console.log('开始下载:', filename);

        if (typeof GM_download !== 'undefined') {
            GM_download({
                url: media.url,
                name: filename,
                onload: function() {
                    console.log('✓ 下载完成:', filename);
                },
                onerror: function(error) {
                    console.error('✗ 下载失败:', error);
                    fallbackDownload(media.url, filename);
                }
            });
        } else {
            fallbackDownload(media.url, filename);
        }
    }

    // 备用下载方法
    function fallbackDownload(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // 批量下载
    function batchDownload() {
        if (allMedia.length === 0) {
            alert('没有可下载的媒体');
            return;
        }

        const confirmed = confirm(`确定要下载所有 ${allMedia.length} 个媒体吗？`);
        if (!confirmed) return;

        allMedia.forEach((media, index) => {
            setTimeout(() => {
                window.downloadMedia(index);
            }, index * 500); // 每个下载间隔500ms
        });

        alert(`已开始批量下载 ${allMedia.length} 个媒体`);
    }

    // 复制链接
    function copyMediaUrl() {
        if (!currentPreviewMedia) return;

        const url = currentPreviewMedia.url;
        const mediaName = currentPreviewMedia.type === 'image' ? '图片' : '视频';

        if (typeof GM_setClipboard !== 'undefined') {
            GM_setClipboard(url);
            alert(`${mediaName}链接已复制到剪贴板！\n` + url);
        } else {
            navigator.clipboard.writeText(url).then(() => {
                alert(`${mediaName}链接已复制到剪贴板！\n` + url);
            }).catch(() => {
                prompt(`请手动复制${mediaName}链接:`, url);
            });
        }
    }

    // 使用事件委托处理媒体库中的按钮点击
    mediaGrid.addEventListener('click', (e) => {
        // 找到被点击的按钮
        const btn = e.target.closest('.gallery-item-btn');
        if (!btn) return;

        // 获取媒体索引
        const item = btn.closest('.gallery-item');
        if (!item) return;

        const index = parseInt(item.dataset.index);
        if (isNaN(index)) {
            console.error('无效的索引');
            return;
        }

        // 根据按钮的 data-action 属性执行相应操作
        const action = btn.dataset.action;
        console.log('点击按钮，操作:', action, '索引:', index);

        if (action === 'preview') {
            previewMedia(index);
        } else if (action === 'download') {
            downloadMedia(index);
        }
    });

    // 清空媒体库
    function clearMediaLibrary() {
        const confirmed = confirm('确定要清空媒体库吗？\n这将清除所有已扫描的媒体记录（不影响原文件）。');
        if (!confirmed) return;

        console.log('清空媒体库...');
        allMedia = [];
        updateUI();
        
        // 显示清空成功提示
        infoDiv.textContent = '✅ 媒体库已清空';
        infoDiv.classList.add('show');
        setTimeout(() => {
            infoDiv.classList.remove('show');
        }, 2000);
    }

    // 事件监听
    floatBtn.addEventListener('click', () => {
        console.log('打开媒体库...');
        // 不需要额外扫描，定时器已在后台持续扫描
        galleryModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    closeGalleryBtn.addEventListener('click', () => {
        // 停止所有正在播放的视频
        const videos = mediaGrid.querySelectorAll('video');
        videos.forEach(video => {
            if (!video.paused) {
                video.pause();
                video.currentTime = 0.1;
            }
        });
        
        galleryModal.classList.remove('show');
        document.body.style.overflow = '';
    });

    refreshBtn.addEventListener('click', () => {
        console.log('手动强制扫描...');
        refreshBtn.textContent = '🔄 扫描中...';
        refreshBtn.disabled = true;
        
        const newCount = scanAllMedia();
        
        // 显示扫描结果
        setTimeout(() => {
            refreshBtn.textContent = '🔄 刷新';
            refreshBtn.disabled = false;
            
            if (newCount > 0) {
                infoDiv.textContent = `✅ 新增 ${newCount} 个媒体`;
            } else {
                infoDiv.textContent = '✅ 暂无新媒体';
            }
            infoDiv.classList.add('show');
            setTimeout(() => {
                infoDiv.classList.remove('show');
            }, 2000);
        }, 500);
    });

    clearBtn.addEventListener('click', clearMediaLibrary);

    batchDownloadBtn.addEventListener('click', batchDownload);

    previewCloseBtn.addEventListener('click', () => {
        previewModal.classList.remove('show');
        const video = previewContent.querySelector('video');
        if (video) video.pause();
        document.body.style.overflow = '';
    });

    previewDownloadBtn.addEventListener('click', () => {
        if (currentPreviewMedia) {
            downloadMedia(currentPreviewMedia.index);
        }
    });

    previewCopyBtn.addEventListener('click', copyMediaUrl);

    // 点击背景关闭
    galleryModal.addEventListener('click', (e) => {
        if (e.target === galleryModal) {
            // 停止所有正在播放的视频
            const videos = mediaGrid.querySelectorAll('video');
            videos.forEach(video => {
                if (!video.paused) {
                    video.pause();
                    video.currentTime = 0.1;
                }
            });
            
            galleryModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.classList.remove('show');
            const video = previewContent.querySelector('video');
            if (video) video.pause();
            document.body.style.overflow = '';
        }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (previewModal.classList.contains('show')) {
                previewModal.classList.remove('show');
                const video = previewContent.querySelector('video');
                if (video) video.pause();
            }
            if (galleryModal.classList.contains('show')) {
                // 停止所有正在播放的视频
                const videos = mediaGrid.querySelectorAll('video');
                videos.forEach(video => {
                    if (!video.paused) {
                        video.pause();
                        video.currentTime = 0.1;
                    }
                });
                
                galleryModal.classList.remove('show');
            }
            document.body.style.overflow = '';
        }
    });

    // 定时扫描器（每秒检查一次，增量更新）
    let scanTimer = null;
    let scanCount = 0;

    function startAutoScan() {
        if (scanTimer) {
            clearInterval(scanTimer);
        }

        // 立即执行一次初始扫描
        console.log('🔍 启动自动扫描（每1秒一次，仅添加新媒体）');
        scanAllMedia();

        // 每1秒扫描一次
        scanTimer = setInterval(() => {
            scanCount++;
            const newCount = scanAllMedia();
            
            // 每30次扫描输出一次统计（避免日志过多）
            if (scanCount % 30 === 0) {
                console.log(`📊 已扫描 ${scanCount} 次，当前共 ${allMedia.length} 个媒体`);
            }
        }, 1000);
    }

    function stopAutoScan() {
        if (scanTimer) {
            clearInterval(scanTimer);
            scanTimer = null;
            console.log('⏸️ 已停止自动扫描');
        }
    }

    // 初始化：页面加载后启动自动扫描
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('页面加载完成，2秒后启动自动扫描');
            setTimeout(startAutoScan, 2000);
        });
    } else {
        console.log('页面已加载，2秒后启动自动扫描');
        setTimeout(startAutoScan, 2000);
    }

    console.log('即梦去水印脚本（媒体库版）初始化完成');
})();

