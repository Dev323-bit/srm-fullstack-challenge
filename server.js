const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

app.post('/bfhl', (req, res) => {
    const { data } = req.body;
    
    const invalid_entries = [];
    const duplicate_edges = [];
    const edges = [];
    const seen_edges = new Set();
    const children_with_parents = new Set();
    const all_nodes = new Set();

    // 1. Validation & Duplicate Checking [cite: 36, 40]
    data.forEach(entry => {
        const trimmed = entry.trim();
        // Regex for X->Y format [cite: 37]
        const match = trimmed.match(/^([A-Z])->([A-Z])$/);
        
        if (!match || match[1] === match[2]) {
            invalid_entries.push(trimmed); // [cite: 38, 39]
            return;
        }

        const edgeStr = `${match[1]}->${match[2]}`;
        if (seen_edges.has(edgeStr)) {
            if (!duplicate_edges.includes(edgeStr)) duplicate_edges.push(edgeStr); // [cite: 42, 43]
            return;
        }

        // Multi-parent rule: first parent wins [cite: 51, 52]
        if (children_with_parents.has(match[2])) return;

        seen_edges.add(edgeStr);
        children_with_parents.add(match[2]);
        edges.push({ p: match[1], c: match[2] });
        all_nodes.add(match[1]);
        all_nodes.add(match[2]);
    });

    // 2. Tree Construction Logic [cite: 44]
    const adj = {};
    edges.forEach(({ p, c }) => {
        if (!adj[p]) adj[p] = [];
        adj[p].push(c);
    });

    // Find Roots [cite: 47, 50]
    const roots = Array.from(all_nodes).filter(node => !children_with_parents.has(node)).sort();
    
    // Cycle Detection & Depth helper [cite: 53, 57]
    const getTreeData = (node, visited = new Set()) => {
        if (visited.has(node)) return { cycle: true };
        visited.add(node);
        
        const treeObj = {};
        let maxDepth = 1;
        const children = adj[node] || [];
        
        for (const child of children) {
            const childData = getTreeData(child, new Set(visited));
            if (childData.cycle) return { cycle: true };
            treeObj[child] = childData.tree;
            maxDepth = Math.max(maxDepth, 1 + childData.depth);
        }
        return { tree: treeObj, depth: maxDepth, cycle: false };
    };

    const hierarchies = [];
    let total_trees = 0;
    let total_cycles = 0;
    let maxOverallDepth = 0;
    let largestRoot = "";

    roots.forEach(root => {
        const result = getTreeData(root);
        if (result.cycle) {
            hierarchies.push({ root, tree: {}, has_cycle: true }); // [cite: 54]
            total_cycles++;
        } else {
            hierarchies.push({ root, tree: { [root]: result.tree }, depth: result.depth }); // [cite: 20, 23]
            total_trees++;
            if (result.depth > maxOverallDepth || (result.depth === maxOverallDepth && root < largestRoot)) {
                maxOverallDepth = result.depth;
                largestRoot = root;
            }
        }
    });

    res.json({
        "user_id": "devnath_07012006", 
        "email": "dk9427@srmist.edu.in",
        "roll_number": "RA2311026010938", 
        hierarchies,
        invalid_entries,
        duplicate_edges,
        "summary": {
            "total_trees": total_trees, // [cite: 63]
            "total_cycles": total_cycles,
            "largest_tree_root": largestRoot
        }
    });
});

const PORT = process.env.PORT || 3000;
const path = require('path');

// This line tells the server to serve your aesthetic frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));