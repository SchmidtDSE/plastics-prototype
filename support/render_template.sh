[ ! -e standalone_tasks/highAmbition.json ] && echo "Skipping guide render..."
[ ! -e standalone_tasks/highAmbition.json ] && cp template/base.html template/base_prerender.html
[ -f standalone_tasks/highAmbition.json ] && echo "Rendering guide..."
[ -f standalone_tasks/highAmbition.json ] && python3 support/render_guide.py template/base.html template/base_prerender.html ./standalone_tasks
python3 support/render_template.py template/base_prerender.html template/index.html index.html
python3 support/render_template.py template/base_prerender.html template/preview.html preview.html
python3 support/render_template.py template/base_prerender.html template/harness.html test/harness.html