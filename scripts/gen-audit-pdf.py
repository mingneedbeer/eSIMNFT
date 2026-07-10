from fpdf import FPDF

class AuditPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "ESIMNFT Smart Contract Audit", align="R", new_x="LMARGIN", new_y="NEXT")
        self.line(10, 14, 200, 14)
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, title):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(20, 80, 40)
        self.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def sub_title(self, title):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(180, 60, 40)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def sub_title_info(self, title):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(40, 80, 160)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def code_block(self, code):
        self.set_font("Courier", "", 8)
        self.set_fill_color(240, 240, 240)
        self.set_text_color(20, 20, 20)
        for line in code.split("\n"):
            if line.strip():
                self.cell(0, 4.5, "  " + line, new_x="LMARGIN", new_y="NEXT", fill=True)
            else:
                self.ln(4.5)
        self.ln(3)

    def finding_box(self, severity, title, body, code=None):
        sev_colors = {
            "HIGH": (180, 40, 40),
            "LOW": (180, 140, 20),
            "INFO": (80, 80, 160),
        }
        bg_colors = {
            "HIGH": (255, 235, 235),
            "LOW": (255, 250, 230),
            "INFO": (235, 235, 255),
        }
        sc = sev_colors.get(severity, (80, 80, 80))
        bc = bg_colors.get(severity, (240, 240, 240))

        # Severity badge
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(*sc)
        self.set_text_color(255, 255, 255)
        badge_w = self.get_string_width(severity) + 6
        self.cell(badge_w, 6, severity, fill=True)
        self.ln(6)

        # Title
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.5, title)
        self.ln(1)

        # Body
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 5, body)

        # Code
        if code:
            self.ln(1)
            self.set_font("Courier", "", 8)
            self.set_fill_color(245, 245, 245)
            self.set_text_color(20, 20, 20)
            self.set_draw_color(200, 200, 200)
            for line in code.split("\n"):
                self.cell(0, 4, "  " + line, new_x="LMARGIN", new_y="NEXT", fill=True)
        self.ln(4)

    def metadata_row(self, label, value):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(60, 60, 60)
        lw = 40
        self.cell(lw, 5.5, label)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(30, 30, 30)
        self.cell(0, 5.5, value, new_x="LMARGIN", new_y="NEXT")


pdf = AuditPDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# ── Title Page ──
pdf.ln(40)
pdf.set_font("Helvetica", "B", 28)
pdf.set_text_color(20, 80, 40)
pdf.cell(0, 14, "Smart Contract Audit", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(4)
pdf.set_font("Helvetica", "", 18)
pdf.set_text_color(60, 60, 60)
pdf.cell(0, 10, "ESIMNFT.sol", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(8)

pdf.set_draw_color(20, 80, 40)
pdf.line(60, pdf.get_y(), 150, pdf.get_y())
pdf.ln(10)

pdf.metadata_row("Contract:", "ESIMNFT")
pdf.metadata_row("Version:", "Solidity ^0.8.28")
pdf.metadata_row("Chain:", "Abstract (testnet 11124 / mainnet 2741)")
pdf.metadata_row("Date:", "2026-07-06")
pdf.metadata_row("Auditor:", "AI-assisted review")
pdf.ln(20)

pdf.set_font("Helvetica", "I", 10)
pdf.set_text_color(100, 100, 100)
pdf.multi_cell(0, 5.5, "This report presents the findings of a security review of the ESIMNFT smart contract. "
    "The analysis covers logic correctness, adherence to ERC standards, access control, "
    "and potential edge cases in the transferable eSIM voucher system.")
pdf.ln(6)

pdf.set_font("Helvetica", "B", 11)
pdf.set_text_color(30, 30, 30)
pdf.cell(0, 7, "Files Reviewed:", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Courier", "", 9)
pdf.set_text_color(60, 60, 60)
pdf.cell(0, 5.5, "contracts/ESIMNFT.sol  (268 lines)", new_x="LMARGIN", new_y="NEXT")
pdf.ln(6)
pdf.set_font("Helvetica", "B", 11)
pdf.set_text_color(30, 30, 30)
pdf.cell(0, 7, "Scope:", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 9.5)
pdf.set_text_color(50, 50, 50)
pdf.multi_cell(0, 5, "ERC-721 token with plan metadata (provider, country, data, validity), "
    "on-chain activation gating transfers, operator role, EIP-712 permit-based activation, "
    "and owner burning of activated tokens.")

# ── Summary ──
pdf.add_page()
pdf.section_title("1  Summary")

pdf.body_text("3 findings were identified: 1 HIGH, 1 LOW, and 1 INFO. "
    "The HIGH-severity finding relates to a broken _exists() implementation that fails to "
    "recognize burned tokens, causing several view functions to return stale data. "
    "The remaining findings are minor code-quality issues.")

# Severity table
pdf.set_font("Helvetica", "B", 9)
pdf.set_fill_color(230, 230, 230)
pdf.set_text_color(30, 30, 30)
col_w = [12, 40, 108, 30]
headers = ["#", "Severity", "Title", "Status"]
for i, h in enumerate(headers):
    pdf.cell(col_w[i], 7, h, border=1, fill=True)
pdf.ln()

findings = [
    ("1", "HIGH", "_exists() ignores burned tokens", "Fix proposed"),
    ("2", "LOW",  "burn() records before state change", "Fix proposed"),
    ("3", "LOW",  "PlanMetadataUpdated event never emitted", "Remove"),
    ("4", "INFO", "setBaseURI() emits no event", "Enhancement"),
    ("5", "INFO", "getBurnedTokens() unbounded array", "Enhancement"),
]
sev_colors = {"HIGH": (255, 220, 220), "LOW": (255, 245, 210), "INFO": (220, 220, 255)}
for row in findings:
    bg = sev_colors.get(row[1], (255, 255, 255))
    pdf.set_fill_color(*bg)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(col_w[0], 6, row[0], border=1, fill=True)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(col_w[1], 6, row[1], border=1, fill=True)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(col_w[2], 6, row[2], border=1, fill=True)
    pdf.cell(col_w[3], 6, row[3], border=1, fill=True)
    pdf.ln()
pdf.ln(6)

# ── Detailed Findings ──
pdf.section_title("2  Detailed Findings")

# F1
pdf.finding_box(
    "HIGH",
    "_exists() does not account for burned tokens",
    "The _exists() function at line 193 uses 'tokenId < _nextTokenId' to determine existence. "
    "After a token is burned, ERC-721's _burn() sets _owners[tokenId] to address(0), but "
    "_exists() still returns true. This means getPlan(), isActivated(), and tokenURI() all "
    "serve stale data for burned tokens, even though ownerOf() correctly reverts. "
    "An off-chain caller relying on these functions would receive misleading data.",
    '// Current (line 193-195):\nfunction _exists(uint256 tokenId)\n    internal view returns (bool) {\n    return tokenId < _nextTokenId;\n}\n\n// Fix:\nfunction _exists(uint256 tokenId)\n    internal view returns (bool) {\n    return _ownerOf(tokenId) != address(0);\n}'
)
pdf.ln(2)

# F2
pdf.finding_box(
    "LOW",
    "burn() records token before _burn() succeeds",
    "At line 137, _burnedTokens.push(tokenId) executes before _burn(tokenId). "
    "If _burn() were to revert (e.g., due to reentrancy or a future OZ change), the token "
    "would be recorded as burned without being burned. Push after the state-changing call.",
    '// Current (line 137-138):\n_burnedTokens.push(tokenId);\n_burn(tokenId);\n\n// Fix:\n_burn(tokenId);\n_burnedTokens.push(tokenId);'
)
pdf.ln(2)

# F3
pdf.finding_box(
    "LOW",
    "PlanMetadataUpdated event is dead code",
    "The event PlanMetadataUpdated is declared at line 54 but no function in the contract "
    "ever emits it. This wastes event signature space and misleads readers. Remove the event "
    "or add emission in relevant functions.",
    '// Line 54 - never emitted:\nevent PlanMetadataUpdated(\n    uint256 indexed tokenId,\n    string country,\n    uint256 dataBytes,\n    uint256 validityDays\n);'
)
pdf.ln(2)

# F4
pdf.finding_box(
    "INFO",
    "setBaseURI() emits no event",
    "The setBaseURI() function at line 175 changes the metadata base URI without emitting "
    "any event. Off-chain indexers and dApps that cache tokenURIs have no way to detect "
    "this change. Add a BaseURIUpdated event.",
    '// Fix:\nevent BaseURIUpdated(string uri);\n\nfunction setBaseURI(string calldata baseURI)\n    external onlyOwner {\n    _baseTokenURI = baseURI;\n    emit BaseURIUpdated(baseURI);\n}'
)
pdf.ln(2)

# F5
pdf.finding_box(
    "INFO",
    "getBurnedTokens() returns unbounded array",
    "The function at line 166 returns the entire _burnedTokens[] dynamic array. "
    "As more tokens are burned, this function grows linearly in gas cost and response size. "
    "Consider removing it (the data is available from Transfer events) or adding pagination.",
    '// Line 166-168:\nfunction getBurnedTokens()\n    external view returns (uint256[] memory) {\n    return _burnedTokens;\n}'
)

# ── Scope and Methodology ──
pdf.add_page()
pdf.section_title("3  Scope & Methodology")

pdf.body_text("The audit covered the full source of contracts/ESIMNFT.sol (268 lines, Solidity 0.8.28). "
    "The following areas were analyzed:")

areas = [
    "ERC-721 compliance and OpenZeppelin v5 integration",
    "Access control: onlyOwner, onlyOperator, per-token ownership checks",
    "Activation lifecycle: mint, transfer, activate, burn sequencing",
    "EIP-712 typed signature verification in activateWithPermit",
    "Reentrancy resistance in state-mutating functions",
    "Token existence and ownership consistency after burns",
    "Gas optimization and storage layout",
    "Event emission completeness",
]
pdf.set_font("Helvetica", "", 9.5)
pdf.set_text_color(50, 50, 50)
for a in areas:
    pdf.cell(5, 6, "-")
    pdf.multi_cell(0, 5.5, a)
    pdf.ln(1)

pdf.ln(4)
pdf.body_text("The audit is a logic review only. It does not include formal verification, "
    "fuzz testing, or economic analysis of the eSIM provider integration. "
    "The off-chain components (backend, Vercel API, wallet integration) are out of scope.")

# ── Recommendations ──
pdf.section_title("4  Recommendations")

recs = [
    ("Fix _exists()", "HIGH - Use _ownerOf(tokenId) != address(0) to correctly "
     "reflect token existence after burns. This is the most critical finding."),
    ("Reorder burn()", "LOW - Move _burn(tokenId) before _burnedTokens.push() to avoid inconsistent state."),
    ("Remove dead event", "LOW - Delete PlanMetadataUpdated unless planned for future use."),
    ("Add BaseURIUpdated event", "INFO - Emit an event in setBaseURI() for transparency."),
    ("Paginate or remove getBurnedTokens()", "INFO - The array grows unboundedly with burns."),
]
for title, desc in recs:
    pdf.sub_title_info(title)
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(50, 50, 50)
    pdf.multi_cell(0, 5, desc)
    pdf.ln(2)

# ── Output ──
path = "/Users/ming/src/1010/ai/eSIMNFT/ESIMNFT_Audit_Report.pdf"
pdf.output(path)
print(f"PDF written to {path}")
print(f"Pages: {pdf.page_no()}")
