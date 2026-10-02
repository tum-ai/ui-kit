"""Produce identical updater archives across release-workflow retries."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(__file__).resolve().parent.parent
output = root / "artifacts/figma/figma-plugin.zip"
output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(output, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
    for name in ("code.js", "manifest.json", "ui.html"):
        entry = ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
        entry.create_system = 3
        entry.external_attr = 0o100644 << 16
        entry.compress_type = ZIP_DEFLATED
        archive.writestr(entry, (root / "artifacts/figma-plugin" / name).read_bytes(), compresslevel=9)
print(output)
