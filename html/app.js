document.addEventListener('DOMContentLoaded', async function () {
    try {
        // 加载更新时间
        const timeResponse = await fetch('run_time.txt');
        const timeContent = await timeResponse.text();
        document.getElementById('run_time').textContent = `更新时间：${timeContent}`;

        // 加载优惠数据
        const response = await fetch('coupon_details.json');
        const data = await response.json();

        // 移除加载动画
        document.getElementById('loading').style.display = 'none';

        // 处理数据
        const categories = Object.keys(data);
        const brandCount = Object.values(data).flat().length;
        document.getElementById(
            'count'
        ).textContent = `品牌数：${brandCount}，分类数：${categories.length}`;

        // 生成分类导航
        const nav = document.getElementById('category-nav');

        // 创建分类容器
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'category-container';

        // 创建头部
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
              <h2>
                  分类列表
                  <span class="category-count">(${categories.length}个分类)</span>
              </h2>
              <i class="fas fa-chevron-down toggle-icon"></i>
          `;

        // 创建内容区域
        const content = document.createElement('div');
        content.className = 'category-content';

        // 创建分类导航
        const categoryNav = document.createElement('div');
        categoryNav.className = 'category-nav';

        // 生成分类链接
        categories.forEach((category) => {
            const link = document.createElement('a');
            link.href = `#${category}`;
            const count = data[category].length;
            link.innerHTML = `${category} <small>(${count})</small>`;
            categoryNav.appendChild(link);

            // 添加点击事件
            link.addEventListener('click', (e) => {
                e.preventDefault();

                // 关闭分类列表
                categoryContainer.classList.remove('category_active');

                // 获取目标卡片
                const targetCard = document.getElementById(category);

                // 滚动到目标位置并添加高亮
                targetCard.scrollIntoView({behavior: 'smooth', block: 'center'});
                targetCard.classList.add('highlight');

                // 移除其他卡片的高亮
                document.querySelectorAll('.category-card.highlight').forEach((card) => {
                    if (card !== targetCard) {
                        card.classList.remove('highlight');
                    }
                });
            });
        });

        // 组装结构
        content.appendChild(categoryNav);
        categoryContainer.appendChild(header);
        categoryContainer.appendChild(content);
        nav.appendChild(categoryContainer);

        // 添加点击事件
        header.addEventListener('click', () => {
            categoryContainer.classList.toggle('category_active');
        });

        // 修改搜索功能
        const searchBox = document.getElementById('categorySearch');
        searchBox.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            const links = categoryNav.querySelectorAll('a');
            let hasVisibleLinks = false;

            links.forEach((link) => {
                const text = link.textContent.toLowerCase();
                const shouldShow = text.includes(searchTerm);
                link.style.display = shouldShow ? 'flex' : 'none';
                if (shouldShow) hasVisibleLinks = true;
            });

            if (searchTerm && hasVisibleLinks) {
                categoryContainer.classList.add('category_active');
                // 添加滚动到顶部的代码
                document.querySelector('.container').scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }

        });

        // 生成优惠券网格
        const grid = document.getElementById('coupon-grid');

        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'coupon-modal';
        document.body.appendChild(modal);

        const sortedCategories = categories.sort((a, b) => {
            const totalReceiveCustomerNumA = data[a].reduce((sum, coupon) => sum + coupon.receive_customer_num, 0);
            const averageReceiveCustomerNumA = totalReceiveCustomerNumA / data[a].length;
            const totalReceiveCustomerNumB = data[b].reduce((sum, coupon) => sum + coupon.receive_customer_num, 0);
            const averageReceiveCustomerNumB = totalReceiveCustomerNumB / data[b].length;
            return averageReceiveCustomerNumB - averageReceiveCustomerNumA;
        });

        sortedCategories.forEach((category) => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.id = category;

            const title = document.createElement('h2');
            const totalReceiveCustomerNum = data[category].reduce((sum, coupon) => sum + coupon.receive_customer_num, 0);
            const averageReceiveCustomerNum = totalReceiveCustomerNum / data[category].length;
            title.innerHTML = `${category} <br><span class="brand-count">共${data[category].length}个品牌<br>平均领取数: ${averageReceiveCustomerNum.toFixed(0)}</span>`;
            card.appendChild(title);
            grid.appendChild(card);

            // 添加点击事件
            card.addEventListener('click', () => {
                // 创建模态框内容
                modal.innerHTML = `
                    <div class="coupon-modal-content">
                        <div class="coupon-modal-header">
                            <h2>${category}</h2>平均领取数: ${averageReceiveCustomerNum.toFixed(0)}
                            <button class="coupon-modal-close">&times;</button>
                        </div>
                        <div class="coupon-modal-body">
                            <ul class="coupon-list">
                                ${data[category]
                                    .sort((a, b) => b.receive_customer_num - a.receive_customer_num) // 按领取数排序
                                    .map(
                                        (coupon) => `
                                            <li class="coupon-item">
                                                <a href="https://list.szlcsc.com/brand/${coupon.brand_id}.html" target="_blank">
                                                    ${coupon.brand_name} - ${coupon.coupon_name}
                                                    <small>(优惠后最低消费${coupon.min_order_after_discount}元)</small>
                                                    <small>- 已领取${coupon.receive_customer_num}张</small>
                                                </a>
                                            </li>
                                        `
                                    )
                                    .join('')}
                            </ul>
                        </div>
                    </div>
                `;

                modal.style.display = 'flex';

                // 关闭按钮事件
                const closeBtn = modal.querySelector('.coupon-modal-close');
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });

                // 点击模态框外部关闭
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            });
        });

        // 添加 ESC 键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('数据加载失败:', error);
        document.getElementById('loading').innerHTML = '<p>数据加载失败，请稍后重试</p>';
    }
});

// 使用说明模态框
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('infoModal');
    const showInfoBtn = document.getElementById('showInfo');
    const closeBtn = document.getElementById('closeModal');

    if (showInfoBtn && modal && closeBtn) {
        showInfoBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // 添加 ESC 键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    }
});

// 返回顶部按钮
document.addEventListener('DOMContentLoaded', function () {
    const backToTopButton = document.getElementById('backToTop');
    const container = document.querySelector('.container');

    // 显示/隐藏返回顶部按钮
    container.addEventListener('scroll', function () {
        if (container.scrollTop > 300) {
            backToTopButton.style.display = 'flex';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    // 点击返回顶部
    backToTopButton.addEventListener('click', function () {
        container.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    });
});

// 修改搜索框交互代码
document.addEventListener('DOMContentLoaded', function () {
    const searchToggle = document.getElementById('searchToggle');
    const searchClose = document.getElementById('searchClose');
    const searchContainer = document.querySelector('.search-container');
    const searchBox = document.querySelector('.search-box');
    const categoryNav = document.querySelector('.category-nav');

    // 打开搜索框
    function openSearch() {
        searchContainer.style.display = 'flex';
        // 强制重绘
        searchContainer.offsetHeight;
        searchContainer.classList.add('active_search');
        setTimeout(() => {
            searchBox.focus();
        }, 300);
    }

    // 关闭搜索框
    function closeSearch() {
        searchContainer.classList.remove('active_search');
        // 等待过渡动画完成后隐藏
        setTimeout(() => {
            searchContainer.style.display = 'none';
        }, 300);
        searchBox.blur();
    }

    // 点击搜索图标
    searchToggle.addEventListener('click', function (e) {
        e.preventDefault();
        if (searchContainer.classList.contains('active_search')) {
            closeSearch();
        } else {
            openSearch();
        }
    });

    // 点击关闭按钮
    searchClose.addEventListener('click', function (e) {
        e.preventDefault();
        closeSearch();
    });

    // ESC键关闭
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && searchContainer.classList.contains('active_search')) {
            closeSearch();
        }
    });

    // 处理搜索框输入
    searchBox.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase();
        const links = document.querySelectorAll('.category-nav a');

        links.forEach((link) => {
            const text = link.textContent.toLowerCase();
            const shouldShow = text.includes(searchTerm);
            link.style.display = shouldShow ? 'flex' : 'none';
        });
    });
});