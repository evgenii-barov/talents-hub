from django.contrib.postgres.operations import TrigramExtension
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("taxonomy", "0001_initial")]

    operations = [TrigramExtension()]
