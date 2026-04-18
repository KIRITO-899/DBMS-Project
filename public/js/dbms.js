// ============================================================
// DBMS Concepts — Interactive Panel
// Multi-Level Indexing & Query Cost Estimation
// ============================================================

const DBMS = {
    indexData: null,
    queryData: null,
    costData: null,

    // ─── Initialize ──────────────────────────────────
    async init() {
        this.setupTabs();
        await this.loadIndexes();
        await this.loadQueries();
        await this.loadCostEstimation();
        this.initRace();
    },

    // ─── Tab Switching ───────────────────────────────
    setupTabs() {
        const tabs = document.querySelectorAll('.dbms-tab');
        const contents = document.querySelectorAll('.dbms-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Kill all animations within the tab contents before switching
                if (window.gsap) {
                    contents.forEach(c => gsap.killTweensOf(c.querySelectorAll('*')));
                }
                
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                const target = tab.dataset.tab;
                const targetEl = document.getElementById(`tabContent-${target}`);
                if (targetEl) targetEl.classList.add('active');
            });
        });
    },

    // ─── Animation Control ───────────────────────────
    stopAnimations() {
        if (!window.gsap) return;
        
        // Stop the Index Race explicitly if it's running
        const raceBtn = document.getElementById('btnStartRace');
        if (raceBtn) {
            raceBtn.disabled = false;
            raceBtn.textContent = 'Restart Simulation';
        }
        
        // Kill all DBMS-related animations
        const dbmsPage = document.getElementById('page-dbms');
        if (dbmsPage) {
            gsap.killTweensOf(dbmsPage.querySelectorAll('.animate-in, .cost-card, .explain-card, .btree-node, .scan-box, #runnerScan, #runnerTree'));
        }
    },

    // ─── Load & Render Indexes ───────────────────────
    async loadIndexes() {
        try {
            const data = await api('/api/dbms/indexes');
            this.indexData = data;
            this.renderIndexLevels(data);
            this.renderBTree();
            this.renderIndexTable(data);
        } catch (err) {
            console.error('Failed to load indexes:', err);
        }
    },

    renderIndexLevels(indexes) {
        const levels = [
            {
                level: 1,
                title: 'Single-Column Indexes',
                desc: 'High-selectivity indexes on individual columns. Ideal for range queries and equality filters on a single attribute.',
                indexes: indexes.filter(i => i.level.includes('Level 1'))
            },
            {
                level: 2,
                title: 'Composite Indexes',
                desc: 'Multi-column indexes following the leftmost prefix rule. Enable efficient multi-predicate queries without separate index lookups.',
                indexes: indexes.filter(i => i.level.includes('Level 2'))
            },
            {
                level: 3,
                title: 'Covering Indexes',
                desc: 'Include all columns needed by the query. The optimizer satisfies the query entirely from the index (index-only scan), eliminating table lookups.',
                indexes: indexes.filter(i => i.level.includes('Level 3'))
            }
        ];

        const grid = document.getElementById('indexLevelsGrid');
        grid.innerHTML = levels.map(l => `
            <div class="index-level-card level-${l.level} animate-in stagger-${l.level}">
                <div class="index-level-num">Level ${l.level}</div>
                <div class="index-level-title">${l.title}</div>
                <div class="index-level-desc">${l.desc}</div>
                <div class="index-level-examples">
                    ${l.indexes.map(i => `
                        <span class="index-example">${i.name} (${i.columns.join(', ')})</span>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    renderBTree() {
        const container = document.getElementById('btreeContainer');
        container.innerHTML = `
            <div class="btree-level">
                <span class="btree-level-label">Root</span>
                <div class="btree-nodes">
                    <div class="btree-node root">
                        <div class="btree-cell">road_id</div>
                        <div class="btree-cell">→</div>
                        <div class="btree-cell">timestamp</div>
                    </div>
                </div>
            </div>
            <div class="btree-connectors">
                <div class="btree-connector"></div>
                <div class="btree-connector"></div>
                <div class="btree-connector"></div>
            </div>
            <div class="btree-level">
                <span class="btree-level-label">Internal</span>
                <div class="btree-nodes">
                    <div class="btree-node internal">
                        <div class="btree-cell">1</div>
                        <div class="btree-cell">5</div>
                        <div class="btree-cell">10</div>
                    </div>
                    <div class="btree-node internal">
                        <div class="btree-cell">15</div>
                        <div class="btree-cell">20</div>
                        <div class="btree-cell">30</div>
                    </div>
                    <div class="btree-node internal">
                        <div class="btree-cell">35</div>
                        <div class="btree-cell">50</div>
                        <div class="btree-cell">75</div>
                    </div>
                </div>
            </div>
            <div class="btree-connectors">
                <div class="btree-connector"></div>
                <div class="btree-connector"></div>
                <div class="btree-connector"></div>
                <div class="btree-connector"></div>
                <div class="btree-connector"></div>
            </div>
            <div class="btree-level">
                <span class="btree-level-label">Leaf</span>
                <div class="btree-nodes">
                    <div class="btree-node leaf">
                        <div class="btree-cell">1→r1</div>
                        <div class="btree-cell">2→r5</div>
                        <div class="btree-cell">3→r3</div>
                    </div>
                    <div class="btree-node leaf">
                        <div class="btree-cell">5→r2</div>
                        <div class="btree-cell">7→r8</div>
                        <div class="btree-cell">9→r4</div>
                    </div>
                    <div class="btree-node leaf">
                        <div class="btree-cell">10→r6</div>
                        <div class="btree-cell">12→r7</div>
                        <div class="btree-cell">14→r9</div>
                    </div>
                    <div class="btree-node leaf">
                        <div class="btree-cell">15→r10</div>
                        <div class="btree-cell">18→r11</div>
                        <div class="btree-cell">→next</div>
                    </div>
                    <div class="btree-node leaf">
                        <div class="btree-cell">35→r15</div>
                        <div class="btree-cell">40→r20</div>
                        <div class="btree-cell">→next</div>
                    </div>
                </div>
            </div>
            <p style="text-align:center; color:var(--text-muted); font-size:0.78rem; margin-top:8px;">
                InnoDB B+ Tree Index — Leaf nodes contain data pointers and are linked for range scans.
                <br>Fan-out ≈ page_size / (key_size + pointer_size) ≈ 16KB / ~20B ≈ 800 entries/node
            </p>
        `;
    },

    renderIndexTable(indexes) {
        const tbody = document.getElementById('indexTableBody');
        tbody.innerHTML = indexes.map(idx => `
            <tr>
                <td>${idx.table}</td>
                <td style="color:var(--accent-cyan); font-family:var(--font-mono); font-size:0.78rem;">${idx.name}</td>
                <td><span class="badge ${idx.level.includes('Primary') ? 'badge-severe' : idx.level.includes('1') ? 'badge-low' : idx.level.includes('3') ? 'badge-moderate' : 'badge-high'}">${idx.level}</span></td>
                <td style="font-family:var(--font-mono); font-size:0.78rem;">${idx.columns.join(', ')}</td>
                <td>${idx.type}</td>
                <td style="font-family:var(--font-mono);">${(idx.cardinality || 0).toLocaleString()}</td>
                <td>${idx.unique ? '✅' : '—'}</td>
            </tr>
        `).join('');
    },

    // ─── Live Index Racing (GSAP) ────────────────────
    initRace() {
        const trackScan = document.getElementById('trackScan');
        const btnStart = document.getElementById('btnStartRace');
        if (!trackScan || !btnStart) return;

        // Generate 50 little boxes for the full scan track
        trackScan.innerHTML = Array(50).fill(0).map(() => 
            `<div style="flex:1; border-right:1px solid var(--border-color); opacity:0.3; transition:0.1s;" class="scan-box"></div>`
        ).join('');

        btnStart.addEventListener('click', () => this.startRace());
    },

    startRace() {
        if (!window.gsap) return;
        const btn = document.getElementById('btnStartRace');
        btn.disabled = true;
        btn.textContent = 'Running...';

        const runnerScan = document.getElementById('runnerScan');
        const runnerTree = document.getElementById('runnerTree');
        const boxes = document.querySelectorAll('.scan-box');
        
        const timeScan = document.getElementById('raceTimeTable');
        const timeTree = document.getElementById('raceTimeTree');

        // Reset
        gsap.set(runnerScan, { x: 0, opacity: 1 });
        gsap.set(runnerTree, { x: 0, y: 0, opacity: 1 });
        gsap.set(boxes, { backgroundColor: 'transparent', opacity: 0.3 });
        timeScan.textContent = '0.00 ms';
        timeTree.textContent = '0.00 ms';

        // 1. Full Scan Animation O(N)
        // Scans through all boxes sequentially
        const scanObj = { time: 0 };
        const tlScan = gsap.timeline();
        tlScan.to(runnerScan, {
            x: trackScan.offsetWidth - 28, // Move to end
            duration: 4.5,
            ease: 'linear',
            onUpdate: function() {
                // Highlight boxes as we pass them
                const progress = this.progress();
                const currentBox = Math.floor(progress * 50);
                if (boxes[currentBox]) {
                    boxes[currentBox].style.backgroundColor = 'var(--accent-red)';
                    boxes[currentBox].style.opacity = '0.8';
                }
            }
        }, 0);
        
        // Timer for full scan (simulating ~240ms)
        gsap.to(scanObj, {
            time: 247.34,
            duration: 4.5,
            ease: 'linear',
            onUpdate: () => timeScan.textContent = scanObj.time.toFixed(2) + ' ms'
        });

        // 2. B+ Tree Animation O(log N)
        // Jumps quickly through 3 levels
        const treeObj = { time: 0 };
        const tlTree = gsap.timeline();
        const treeWidth = document.getElementById('trackTree').offsetWidth;
        const treeNodes = document.querySelectorAll('.tree-level-line > div');
        const treeLines = document.querySelectorAll('.tree-level-line');

        // Reset tree colors
        gsap.set(treeNodes, { backgroundColor: 'var(--text-muted)', boxShadow: 'none' });
        gsap.set(treeLines, { backgroundColor: 'var(--bg-black)' });

        tlTree.to(runnerTree, { x: treeWidth * 0.25, y: 17, duration: 0.15, ease: 'power2.out', onComplete: () => {
                if(treeNodes[0]) gsap.to(treeNodes[0], { backgroundColor: 'var(--accent-cyan)', boxShadow: '0 0 8px var(--accent-cyan)', duration: 0.1 });
                if(treeLines[0]) gsap.to(treeLines[0], { backgroundColor: 'rgba(0, 229, 255, 0.2)', duration: 0.1 });
              }}, 0)
              .to(runnerTree, { x: treeWidth * 0.1, y: 34, duration: 0.15, ease: 'power2.out', onComplete: () => {
                if(treeNodes[1]) gsap.to(treeNodes[1], { backgroundColor: 'var(--accent-cyan)', boxShadow: '0 0 8px var(--accent-cyan)', duration: 0.1 });
                if(treeLines[1]) gsap.to(treeLines[1], { backgroundColor: 'rgba(0, 229, 255, 0.2)', duration: 0.1 });
              }}, 0.2)
              .to(runnerTree, { x: treeWidth * 0.3, y: 34, duration: 0.1, ease: 'power2.out', onComplete: () => {
                if(treeNodes[2]) gsap.to(treeNodes[2], { backgroundColor: 'var(--accent-cyan)', boxShadow: '0 0 8px var(--accent-cyan)', duration: 0.1 });
                if(treeLines[2]) gsap.to(treeLines[2], { backgroundColor: 'rgba(0, 229, 255, 0.2)', duration: 0.1 });
              }}, 0.4) // Arrive at data
              .call(() => {
                  btn.disabled = false;
                  btn.textContent = '🏁 Start Race';
                  
                  // Flash green on tree finish
                  gsap.to(runnerTree, { scale: 1.5, boxShadow: '0 0 20px var(--accent-cyan)', duration: 0.2, yoyo: true, repeat: 1 });
                  timeTree.style.color = 'var(--accent-green)';
                  setTimeout(()=> timeTree.style.color = 'inherit', 1500);
              });

        // Timer for B+ Tree (simulating ~2ms)
        gsap.to(treeObj, {
            time: 2.15,
            duration: 0.5,
            ease: 'power2.out',
            onUpdate: () => timeTree.textContent = treeObj.time.toFixed(2) + ' ms'
        });
    },

    // ─── Load & Render Queries (EXPLAIN) ─────────────
    async loadQueries() {
        try {
            const data = await api('/api/dbms/queries');
            this.queryData = data;
            this.renderQueryList(data);
        } catch (err) {
            console.error('Failed to load queries:', err);
        }
    },

    renderQueryList(queries) {
        const list = document.getElementById('queryList');
        list.innerHTML = queries.map(q => `
            <div class="query-item" data-query-id="${q.id}" onclick="DBMS.selectQuery(${q.id})">
                <div class="query-num">${q.id}</div>
                <div class="query-info">
                    <div class="query-name">${q.name}</div>
                    <div class="query-desc">${q.description}</div>
                </div>
                <span class="query-level-badge l${q.indexLevel}">Level ${q.indexLevel}</span>
            </div>
        `).join('');
    },

    async selectQuery(queryId) {
        // Highlight selected
        document.querySelectorAll('.query-item').forEach(el => el.classList.remove('active'));
        document.querySelector(`.query-item[data-query-id="${queryId}"]`)?.classList.add('active');

        try {
            const data = await api(`/api/dbms/explain/${queryId}`);
            this.renderExplainResults(data);
        } catch (err) {
            console.error('Failed to load EXPLAIN:', err);
        }
    },

    renderExplainResults(data) {
        const container = document.getElementById('explainResults');
        const { query, withIndex, withoutIndex } = data;

        const renderExplainTable = (rows) => {
            if (!rows || rows.length === 0) return '<p style="color:var(--text-muted)">No data</p>';
            const cols = ['id', 'select_type', 'table', 'type', 'possible_keys', 'key', 'key_len', 'rows', 'filtered', 'Extra'];
            return `
                <table class="explain-table">
                    <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
                    <tbody>
                        ${rows.map(row => `<tr>${cols.map(c => {
                            let cls = '';
                            if (c === 'key' && row[c]) cls = 'highlight';
                            if (c === 'rows' && row[c] > 1000) cls = 'warn';
                            if (c === 'type' && row[c] === 'ALL') cls = 'warn';
                            return `<td class="${cls}">${row[c] !== null && row[c] !== undefined ? row[c] : 'NULL'}</td>`;
                        }).join('')}</tr>`).join('')}
                    </tbody>
                </table>
            `;
        };

        const rowsW  = withIndex.reduce((s, r) => s + (r.rows || 0), 0);
        const rowsWO = withoutIndex.reduce((s, r) => s + (r.rows || 0), 0);
        const improvement = rowsWO > 0 ? ((1 - rowsW / rowsWO) * 100).toFixed(1) : 0;

        container.innerHTML = `
            <div class="explain-card animate-in">
                <h4>📝 SQL Query</h4>
                <div class="sql-block">${query.sql}</div>
                <p style="font-size:0.82rem; color:var(--text-secondary);">
                    <strong>Index Used:</strong> <span style="color:var(--accent-cyan)">${query.indexUsed}</span>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    <strong>Index Level:</strong> <span class="query-level-badge l${query.indexLevel}">Level ${query.indexLevel}</span>
                </p>
            </div>

            <div class="explain-card animate-in stagger-1">
                <h4><span class="dot-green">●</span> WITH Index — EXPLAIN Output</h4>
                ${renderExplainTable(withIndex)}
                <p style="margin-top:12px; font-size:0.82rem; color:var(--text-secondary);">
                    Rows examined: <strong style="color:var(--accent-green)">${rowsW.toLocaleString()}</strong>
                </p>
            </div>

            <div class="explain-card animate-in stagger-2">
                <h4><span class="dot-red">●</span> WITHOUT Index (IGNORE INDEX) — EXPLAIN Output</h4>
                ${renderExplainTable(withoutIndex)}
                <p style="margin-top:12px; font-size:0.82rem; color:var(--text-secondary);">
                    Rows examined: <strong style="color:var(--accent-red)">${rowsWO.toLocaleString()}</strong>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    Performance improvement with index: <strong style="color:var(--accent-green)">${improvement}%</strong>
                </p>
            </div>
        `;
    },

    // ─── Load & Render Cost Estimation ───────────────
    async loadCostEstimation() {
        try {
            const data = await api('/api/dbms/cost-estimation');
            this.costData = data;
            this.renderCostOverview(data.tableStats);
            this.renderCostComparison(data.queries);
        } catch (err) {
            console.error('Failed to load cost estimation:', err);
        }
    },

    renderCostOverview(stats) {
        const container = document.getElementById('costOverview');
        container.innerHTML = `
            <div class="chart-header">
                <h3>Table Statistics — ${stats.tableName}</h3>
                <span class="chart-badge">InnoDB Engine</span>
            </div>
            <div class="cost-stats">
                <div class="cost-stat">
                    <div class="cost-stat-value">${stats.totalRows.toLocaleString()}</div>
                    <div class="cost-stat-label">Total Rows</div>
                </div>
                <div class="cost-stat">
                    <div class="cost-stat-value">${stats.totalPages.toLocaleString()}</div>
                    <div class="cost-stat-label">Data Pages</div>
                </div>
                <div class="cost-stat">
                    <div class="cost-stat-value">${(stats.dataLengthBytes / 1024 / 1024).toFixed(2)} MB</div>
                    <div class="cost-stat-label">Data Size</div>
                </div>
                <div class="cost-stat">
                    <div class="cost-stat-value">${stats.avgRowLength} B</div>
                    <div class="cost-stat-label">Avg Row Length</div>
                </div>
                <div class="cost-stat">
                    <div class="cost-stat-value">${(stats.indexLengthBytes / 1024 / 1024).toFixed(2)} MB</div>
                    <div class="cost-stat-label">Index Size</div>
                </div>
                <div class="cost-stat">
                    <div class="cost-stat-value">${(stats.pageSize / 1024).toFixed(0)} KB</div>
                    <div class="cost-stat-label">Page Size</div>
                </div>
            </div>
        `;
    },

    renderCostComparison(queries) {
        const container = document.getElementById('costComparisonGrid');
        container.innerHTML = queries.map(q => {
            const m = q.metrics;
            const maxIO  = Math.max(m.ioCostWith, m.ioCostWithout, 1);
            const maxCPU = Math.max(m.cpuCostWith, m.cpuCostWithout, 0.01);
            const maxRows = Math.max(m.rowsExaminedWith, m.rowsExaminedWithout, 1);

            return `
                <div class="cost-card animate-in">
                    <div class="cost-card-header">
                        <div>
                            <div class="cost-card-title">${q.queryName}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px">Index: ${q.indexUsed}</div>
                        </div>
                        <span class="improvement-badge ${m.improvementPct >= 0 ? 'positive' : 'negative'}">
                            ${m.improvementPct >= 0 ? '↑' : '↓'} ${Math.abs(m.improvementPct)}% ${m.improvementPct >= 0 ? 'faster' : 'slower'}
                        </span>
                    </div>

                    <div class="cost-metrics">
                        <div class="cost-metric">
                            <div class="cost-metric-label">Rows Examined</div>
                            <div class="cost-metric-row">
                                <span class="cost-metric-tag with">With</span>
                                <div class="cost-bar-track"><div class="cost-bar with" style="width:${(m.rowsExaminedWith/maxRows*100).toFixed(1)}%"></div></div>
                                <span class="cost-metric-value">${m.rowsExaminedWith.toLocaleString()}</span>
                            </div>
                            <div class="cost-metric-row">
                                <span class="cost-metric-tag without">Without</span>
                                <div class="cost-bar-track"><div class="cost-bar without" style="width:${(m.rowsExaminedWithout/maxRows*100).toFixed(1)}%"></div></div>
                                <span class="cost-metric-value">${m.rowsExaminedWithout.toLocaleString()}</span>
                            </div>
                        </div>

                        <div class="cost-metric">
                            <div class="cost-metric-label">Selectivity Factor</div>
                            <div class="cost-metric-row">
                                <span class="cost-metric-tag with">With</span>
                                <div class="cost-bar-track"><div class="cost-bar with" style="width:${Math.min(m.selectivityWith * 100, 100).toFixed(1)}%"></div></div>
                                <span class="cost-metric-value">${m.selectivityWith}</span>
                            </div>
                            <div class="cost-metric-row">
                                <span class="cost-metric-tag without">Without</span>
                                <div class="cost-bar-track"><div class="cost-bar without" style="width:${Math.min(m.selectivityWithout * 100, 100).toFixed(1)}%"></div></div>
                                <span class="cost-metric-value">${m.selectivityWithout}</span>
                            </div>
                        </div>

                        <div class="cost-metric">
                            <div class="cost-metric-label">I/O Cost (Pages)</div>
                            <div class="cost-metric-row">
                                <span class="cost-metric-tag with">With</span>
                                <div class="cost-bar-track"><div class="cost-bar with" style="width:${(m.ioCostWith/maxIO*100).toFixed(1)}%"></div></div>
                                <span class="cost-metric-value">${m.ioCostWith}</span>
                            </div>
                            <div class="cost-metric-row">
                                <span class="cost-metric-tag without">Without</span>
                                <div class="cost-bar-track"><div class="cost-bar without" style="width:${(m.ioCostWithout/maxIO*100).toFixed(1)}%"></div></div>
                                <span class="cost-metric-value">${m.ioCostWithout}</span>
                            </div>
                        </div>

                        <div class="cost-metric">
                            <div class="cost-metric-label">CPU Cost</div>
                            <div class="cost-metric-row">
                                <span class="cost-metric-tag with">With</span>
                                <div class="cost-bar-track"><div class="cost-bar with" style="width:${(m.cpuCostWith/maxCPU*100).toFixed(1)}%"></div></div>
                                <span class="cost-metric-value">${m.cpuCostWith}</span>
                            </div>
                            <div class="cost-metric-row">
                                <span class="cost-metric-tag without">Without</span>
                                <div class="cost-bar-track"><div class="cost-bar without" style="width:${(m.cpuCostWithout/maxCPU*100).toFixed(1)}%"></div></div>
                                <span class="cost-metric-value">${m.cpuCostWithout}</span>
                            </div>
                        </div>
                    </div>

                    <div style="padding:12px 16px; background:rgba(0,0,0,0.2); border-radius:var(--radius-sm); font-size:0.75rem; color:var(--text-muted);">
                        <strong style="color:var(--text-secondary)">Total Cost:</strong>&nbsp;
                        <span style="color:var(--accent-green)">${m.totalCostWith}</span> (with index)
                        &nbsp;vs&nbsp;
                        <span style="color:var(--accent-red)">${m.totalCostWithout}</span> (without index)
                        &nbsp;&nbsp;|&nbsp;&nbsp;
                        <strong>Formula:</strong> Total = I/O Pages + (Rows × CPU_tuple_cost)
                    </div>
                </div>
            `;
        }).join('');

        // Animate bars after render
        setTimeout(() => {
            container.querySelectorAll('.cost-bar').forEach(bar => {
                bar.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
            });
        }, 100);
    }
};
