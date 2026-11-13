// Jesus I am sayings layer, with full motif verses, Rock / Stones, and OpenBible.info cross-references.
// OpenBible.info data is CC-BY; attribute OpenBible.info.
// Load from this folder. Verse text is the public-domain KJV used in this project.

CREATE CONSTRAINT iam_node IF NOT EXISTS FOR (n:IAmNode) REQUIRE n.node_id IS UNIQUE;

LOAD CSV WITH HEADERS FROM 'file:///nodes.csv' AS row
MERGE (n:IAmNode {node_id: row.node_id})
SET n.label = row.label,
    n.kind = row.kind,
    n.verse_count = CASE WHEN row.verse_count = '' THEN null ELSE toInteger(row.verse_count) END;

LOAD CSV WITH HEADERS FROM 'file:///edges.csv' AS row
MATCH (a:IAmNode {node_id: row.source})
MATCH (b:IAmNode {node_id: row.target})
MERGE (a)-[r:IAM_EDGE {rel: row.rel, kind: row.kind}]->(b)
SET r.shared = CASE WHEN row.shared = '' THEN null ELSE toInteger(row.shared) END,
    r.pmi = row.pmi,
    r.jaccard = row.jaccard,
    r.note = row.note;

LOAD CSV WITH HEADERS FROM 'file:///mentions.csv' AS row
MERGE (v:Verse {verse_id: row.verse_id})
SET v.ref = row.ref, v.text = row.text
WITH row, v
MATCH (s:IAmNode {node_id: row.saying_id})
MERGE (s)-[m:MENTIONS {role: row.role, subgroup: row.subgroup, motif: row.motif}]->(v);

// Verse-level OpenBible.info cross-references (CC-BY; attribute OpenBible.info)
// from each saying's John verses. Edge type is CROSS_REF.
LOAD CSV WITH HEADERS FROM 'file:///cross_refs.csv' AS row
MERGE (a:Verse {verse_id: row.from_verse_id})
SET a.ref = row.from_ref
MERGE (b:Verse {verse_id: row.to_verse_id})
SET b.ref = row.to_ref
MERGE (a)-[x:CROSS_REF {source: row.source}]->(b)
SET x.votes = toInteger(row.votes),
    x.license = row.license,
    x.saying_id = row.saying_id;
