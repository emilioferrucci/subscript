#!/usr/bin/env python3
"""Build Subscript's reproducible unsigned XPI using Python's standard library."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
version = json.loads((root / "extension/manifest.json").read_text())["version"]
dest = root / "dist"
dest.mkdir(exist_ok=True)
package = dest / f"subscript-{version}-unsigned.xpi"
files = [(p, p.relative_to(root / "extension").as_posix())
         for p in (root / "extension").rglob("*") if p.is_file()]
files.append((root / "LICENSE", "LICENSE"))
with ZipFile(package, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
    for file, name in sorted(files, key=lambda item: item[1]):
        info = ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        archive.writestr(info, file.read_bytes())
checksum = hashlib.sha256(package.read_bytes()).hexdigest()
(dest / "SHA256SUMS.txt").write_text(f"{checksum}  {package.name}\n")
print(f"{package}\nSHA256 {checksum}")
