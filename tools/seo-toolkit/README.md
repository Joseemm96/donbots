# seo-toolkit (dependencia de las skills `skills/seo*`)

En el box de Grok Bot, `/workspace/seo-toolkit` era un clon de **https://github.com/AgricIDaniel/claude-seo** en **v2.4.2** (commit `c167521`) con un `.venv` y este wrapper `seo` (`seo <script> [args]` → corre `scripts/<script>.py` con el venv).

Para recrearlo:
```bash
git clone https://github.com/AgricIDaniel/claude-seo seo-toolkit && cd seo-toolkit
git checkout v2.4.2   # o la última versión
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp ../grok-bots-handoff/tools/seo-toolkit/seo . && chmod +x seo
```
Luego ajusta en las skills la ruta `/workspace/seo-toolkit` a donde lo clones. Para Codex, usa directamente el fork `Joseemm96/codex-seo` (v2.5.0).
Nota: `SEO_TOOLKIT_FAKEIP=1` y la ruta `/workspace/seo-toolkit` eran propios del box de Grok Bot; fuera de él usa `SEO_TOOLKIT_FAKEIP=0` y tu ruta.
