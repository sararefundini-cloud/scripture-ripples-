# Scripture Ripples

Most people only ever see the head of the Slinky. Scripture Ripples shows the whole coil.

Scripture Ripples is an interactive map of the Bible (KJV). Each motif is a stone: tap one and it drops into the water, and its rings travel out to the connected stones that explain it. It started from my Six Sigma (DMAIC) project, *Beyond the Narrative: A Systems Approach to Biblical Literacy*. The defect is simple: readers stall or quit in the Old Testament when they reach stonings and mass deaths, because those passages come to them one at a time and look like madness. Read backward to the covenant and the Law, and forward to the pivot, they follow a consistent pattern.

**[Open the app](https://sararefundini-cloud.github.io/scripture-ripples-/)** (works on phones)

## What's inside
- **I am & stones:** Jesus' "I am" sayings, each with every verse in its motif (bread, light, sheep, way, vine, death and resurrection), plus Rock / Stones and God as its own node.
- **Explained by:** Death, Infant Death, and Stoning are linked to the motifs that explain them (sin and the Law, blood and sacrifice, Passover, the Rock). Whatever stays unexplained is listed honestly.
- **Reading companion, Stonings:** a ledger of the debt, the bigger debt, who pays, and the payment, then every stoning passage with its law details, lawful use or misuse, the Rock and refuge, and where it points to Jesus.
- **Economy of God:** a 48-term symbolic lexicon.

## Next phase
Each Bible story will become a "throw" dropped onto the motif rocks it touches. Ring size will be the blast radius. The first turn is Samson at Gaza (about 3000 on the roof, Judges 16:27; he slew more at his death than in his life, Judges 16:30) against David sparing Saul (1 Samuel 24 and 26; 0 deaths at the sparing).

## Method
- Every claim is labeled **TEXT** (in the verse), **INFERENCE** (a reading), or **TYPOLOGY** (a traditional connection).
- Counts are computed from the KJV text. Story pairs are scored with my Structural Alignment Matrix (Trigger, Scale, Exchange, Pivot, Outcome, each 0–3).
- `neo4j/` contains the graph model as CSVs, ready to import into Neo4j.

## Sources
- King James Version (public domain).
- Cross-references from [OpenBible.info](https://www.openbible.info/labs/cross-references/), licensed CC-BY.

Designed by Sara Refundini. Built with AI-assisted analysis.
