#!/bin/bash
# Zenith Tools — redeploy to production with the freemium fix on all 8 tools.
# Run from this folder. Needs the connected Vercel OAuth (already linked).
cd "$(dirname "$0")"
python3 -c "
import json
files = []
for fn in ['index.html','image-compressor.html','image-resizer.html','password-generator.html','pdf-tools.html','qr-generator.html','color-picker.html','unit-converter.html','word-counter.html','shared.js','style.css']:
    files.append({'file': fn, 'data': open(fn, encoding='utf-8').read(), 'encoding': 'utf-8'})
args = {'requestBody': {'name': 'zenith-tools', 'project': 'zenith-tools', 'target': 'production', 'forceNew': '1', 'files': files}}
open('/tmp/zenith_tools_deploy.json','w').write(json.dumps(args))
print('deploy args ready:', len(files), 'files')
"
timeout 180 vercel call-tool --name create_deployment --arguments-json "$(cat /tmp/zenith_tools_deploy.json)"
