from django.contrib import admin

from apps.early_access.models import EarlyAccessSignup, WishlistItem

admin.site.register(EarlyAccessSignup)
admin.site.register(WishlistItem)
