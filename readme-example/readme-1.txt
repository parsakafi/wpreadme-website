=== Jetexir Iran Post ===
Contributors: parselearn
Tags: woocommerce, jetexir, iran post, tracking, shipping
Requires at least: 6.7
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0
License: GPLv3
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Lets admins set an Iran Post (Post BarCode) tracking code from the WooCommerce order screen and notify the customer — as a Jetexir add-on.

== Description ==

### Jetexir Iran Post Tracking ###

Jetexir Iran Post Tracking is a lightweight add-on for the [Jetexir](https://parsa.ws) WooCommerce plugin that adds Iran Post shipping tracking to your store. It lets shop managers enter a **post tracking code** directly on the WooCommerce admin order detail screen, saves it as order meta, and (optionally) e-mails the customer a tracking link when the code is set or changed.

The add-on appears in **Jetexir → Addons** (Order category) and is toggleable like any other Jetexir add-on.

= Key Features =

* **Admin tracking field** — Adds a "Post tracking code" input to the WooCommerce admin order screen (after the shipping address), using HPOS-compatible meta saving.
* **Customer order detail** — Shows the tracking code on the customer's WooCommerce account order detail page (My Account → Orders → View order), with an optional clickable tracking link.
* **Customer e-mail notification** — Optionally sends an e-mail to the customer whenever a tracking code is set or changed, with `{tracking_code}`, `{tracking_link}`, and `{order_number}` tokens.
* **Configurable field label** — Override the default Persian order-screen label.
* **Configurable tracking URL** — Builds a clickable tracking link; defaults to the Iran Post radar URL.
* **Clickable customer link** — Render the tracking code as a tracking link on the customer's order detail page (toggle).
* **Jetexir add-on** — Toggle it on/off from Jetexir → Addons; its settings live in the Jetexir Order tab.
* **Fully translatable** — Ships with a `.pot` template and a Persian (`fa_IR`) translation; text domain `jetexir-iran-post`.

= How it works =

1. Enable the add-on in **Jetexir → Addons** (Order category).
2. Open any WooCommerce order. A "Post tracking code" field appears under the shipping address.
3. Enter the Iran Post tracking code and save the order. The code is stored as order meta.
4. If the customer e-mail option is enabled, the customer is notified with a tracking link.
5. The tracking code appears on the customer's **View order** page in My Account.

== External services ==

This plugin does not send any data to external services on its own.

When a tracking URL is configured (or the default Iran Post radar URL is used), the **tracking link** shown to customers points to the Iran Post tracking page (https://tracking.post.ir by default) or Tipax (https://mt.tipax.ir). No data is transmitted by the plugin itself — the link is simply opened in the customer's browser when they click it.

== Installation ==

= Minimum Requirements =

* PHP 7.4 or greater (PHP 8.0+ recommended)
* WordPress 6.7 or greater
* WooCommerce (active)
* Jetexir (active)

= Automatic installation =

1. In your WordPress dashboard, go to **Plugins → Add New**.
2. Upload the `jetexir-iran-post` plugin zip, or place the folder in `wp-content/plugins/`.
3. Activate **Jetexir Iran Post Tracking**.
4. Make sure **Jetexir** and **WooCommerce** are active.
5. Go to **Jetexir → Addons**, find **Iran Post Tracking** (Order category) and enable it.

= Manual installation =

1. Upload the `jetexir-iran-post` folder to `/wp-content/plugins/`.
2. Activate the plugin through the **Plugins** screen.
3. Enable the add-on under **Jetexir → Addons**.

== Frequently Asked Questions ==

= Does this require Jetexir? =

Yes. This plugin registers itself as a Jetexir add-on, so both **Jetexir** and **WooCommerce** must be active. If either is missing, the plugin stays dormant and shows an admin notice.

= Where do I set the tracking code? =

On any WooCommerce order, in the admin edit screen, just below the shipping address. Save the order to store the code.

= Can customers see their tracking code? =

Yes — it is shown on the customer's **View order** page in My Account (My Account → Orders → View order), once an admin has saved a code for that order.

= Can I change the e-mail text? =

Yes. In the add-on settings (Jetexir → Order tab → Iran Post section) you can set the e-mail subject and message, using the `{tracking_code}`, `{tracking_link}`, and `{order_number}` tokens.

== Screenshots ==

1. WooCommerce admin order screen with the Post tracking code field
2. Jetexir → Addons (Iran Post Tracking enabled)
3. Iran Post settings section under the Jetexir Order tab
4. Customer e-mail with tracking link
5. Tracking code shown on the customer's View order page

== Changelog ==

= 1.0.0 - 2026-08-19 =
* Initial release.
* Adds a Post tracking code field to the WooCommerce admin order screen.
* Shows the tracking code on the customer's WooCommerce account order detail page.
* Adds optional customer e-mail notification with configurable subject/message tokens.
* Adds configurable field label.
* Registers as a toggleable Jetexir add-on (Order category) with its own settings section.
* Ships with a `.pot` template and Persian (`fa_IR`) translation.
