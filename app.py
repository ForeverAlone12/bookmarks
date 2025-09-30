from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_bootstrap import Bootstrap5
from models import db, Group, Site
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

Bootstrap5(app)
db.init_app(app)

# Создание таблиц
with app.app_context():
    db.create_all()


# Главная страница - отображение сайтов по группам
@app.route('/')
def index():
    groups = Group.query.order_by(Group.display_order.asc()).all()
    return render_template('index.html', groups=groups)


# Эндпоинт для обновления порядка групп
@app.route('/admin/groups/reorder', methods=['POST'])
def reorder_groups():
    try:
        order_data = request.get_json()
        for item in order_data:
            group = Group.query.get(item['id'])
            if group:
                group.display_order = item['order']

        db.session.commit()
        return jsonify({'success': True, 'message': 'Порядок групп обновлен'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# Админка - главная страница
@app.route('/admin/')
def admin_dashboard():
    groups_count = Group.query.count()
    sites_count = Site.query.count()
    return render_template('admin/dashboard.html',
                           groups_count=groups_count,
                           sites_count=sites_count)


# Управление группами
@app.route('/admin/groups')
def admin_groups():
    groups = Group.query.all()
    return render_template('admin/groups.html', groups=groups)


@app.route('/admin/groups/add', methods=['POST'])
def add_group():
    name = request.form.get('name')
    description = request.form.get('description')

    if name:
        group = Group(name=name, description=description)
        db.session.add(group)
        db.session.commit()
        flash('Группа успешно добавлена', 'success')
    else:
        flash('Название группы обязательно', 'error')

    return redirect(url_for('admin_groups'))


@app.route('/admin/groups/edit/<int:id>', methods=['POST'])
def edit_group(id):
    group = Group.query.get_or_404(id)
    group.name = request.form.get('name')
    group.description = request.form.get('description')

    db.session.commit()
    flash('Группа успешно обновлена', 'success')
    return redirect(url_for('admin_groups'))


@app.route('/admin/groups/delete/<int:id>')
def delete_group(id):
    group = Group.query.get_or_404(id)
    db.session.delete(group)
    db.session.commit()
    flash('Группа успешно удалена', 'success')
    return redirect(url_for('admin_groups'))


# Управление сайтами
@app.route('/admin/sites')
def admin_sites():
    sites = Site.query.all()
    groups = Group.query.all()
    return render_template('admin/sites.html', sites=sites, groups=groups)


@app.route('/admin/sites/add', methods=['POST'])
def add_site():
    name = request.form.get('name')
    url = request.form.get('url')
    description = request.form.get('description')
    icon_url = request.form.get('icon_url')
    group_id = request.form.get('group_id')

    if name and url and group_id:
        site = Site(
            name=name,
            url=url,
            description=description,
            icon_url=icon_url,
            group_id=group_id
        )
        db.session.add(site)
        db.session.commit()
        flash('Сайт успешно добавлен', 'success')
    else:
        flash('Название, URL и группа обязательны', 'error')

    return redirect(url_for('admin_sites'))


@app.route('/admin/sites/edit/<int:id>', methods=['POST'])
def edit_site(id):
    site = Site.query.get_or_404(id)
    site.name = request.form.get('name')
    site.url = request.form.get('url')
    site.description = request.form.get('description')
    site.icon_url = request.form.get('icon_url')
    site.group_id = request.form.get('group_id')

    db.session.commit()
    flash('Сайт успешно обновлен', 'success')
    return redirect(url_for('admin_sites'))


@app.route('/admin/sites/delete/<int:id>')
def delete_site(id):
    site = Site.query.get_or_404(id)
    db.session.delete(site)
    db.session.commit()
    flash('Сайт успешно удален', 'success')
    return redirect(url_for('admin_sites'))


if __name__ == '__main__':
    app.run(debug=True)