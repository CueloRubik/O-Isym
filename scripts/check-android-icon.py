#!/usr/bin/env python3
"""Inspect the compiled launcher chain, including version-qualified resources."""
import os
import re
import subprocess
import sys
import zipfile

apk = sys.argv[1]
aapt = os.path.join(os.environ["ANDROID_HOME"], "build-tools", "36.0.0", "aapt")
def dump(*args):
    return subprocess.check_output([aapt, "dump", *args], text=True)
resources = dump("resources", apk)
def resource_id(name):
    match = re.search(r"resource (0x[0-9a-f]+) [^\s:]+:" + re.escape(name) + r"\b", resources)
    assert match, "Missing compiled resource: " + name
    return match.group(1)
with zipfile.ZipFile(apk) as archive:
    entries = archive.namelist()
    foregrounds = [name for name in entries if name.startswith("res/") and name.endswith("/oisym_app_foreground.xml")]
    images = [name for name in entries if name.startswith("res/") and name.endswith("/oisym_app_icon.png")]
    assert len(foregrounds) == 1, ("Unexpected foreground qualifier override", foregrounds)
    assert len(images) == 1, ("Expected exactly one official icon bitmap", images)
    for name in ("oisym_launcher", "oisym_launcher_round"):
        adaptive = "res/mipmap-anydpi-v26/" + name + ".xml"
        xml = dump("xmltree", apk, adaptive)
        assert resource_id("drawable/oisym_app_foreground") in xml, "Adaptive icon uses the wrong foreground"
        assert "monochrome" not in xml, "No separately drawn monochrome icon is allowed"
        legacy = "res/mipmap-anydpi/" + name + ".xml"
        assert resource_id("drawable/oisym_app_icon") in dump("xmltree", apk, legacy)
    assert resource_id("drawable/oisym_app_icon") in dump("xmltree", apk, foregrounds[0])
badging = dump("badging", apk)
assert re.search(r"application:.*icon='res/mipmap-anydpi-v26/oisym_launcher.xml'", badging), "Manifest must select the O-Isym resource family"
print("Android launcher verified: manifest -> O-Isym adaptive foreground -> app.png; no template v24 override")
