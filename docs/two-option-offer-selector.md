# Two-option offer selector

This section creates two purchase option cards, usually used as:

1. A normal single-item option such as `BUY 1`
2. A special offer option such as `BUY 2`

The section can add products to cart using Shopify's Ajax Cart API and can apply an existing Shopify discount code to the cart.

## Important discount rule

The section does not create the discount code.

The store owner must create the discount code first inside Shopify Admin. The section only applies the code after the offer button is clicked.

If the discount code is not active, expired, misspelled, or not applicable to the cart, Shopify will not apply the discount.

## Recommended setup for the Buy 2 button

Example:

The store owner wants the second button to say:

`BUY 2`

and apply this discount code:

`BUY2SAVE10`

The section settings should be:

`Offer option quantity`: `2`

`Offer discount code`: `BUY2SAVE10`

The Shopify discount code should also be named exactly:

`BUY2SAVE10`

The code in Shopify Admin and the code in the section must match.

## How to create the discount code in Shopify

Go to Shopify Admin.

Open `Discounts`.

Click `Create discount`.

Choose `Discount code`.

Enter the code exactly as you want the section to use it. Example:

`BUY2SAVE10`

Choose the discount type that matches the offer.

For a Buy 2 product offer, common choices are:

`Amount off products`

or

`Percentage off products`

Set the discount to apply only to the correct product or collection.

Set the minimum requirement to match the offer. For a Buy 2 offer, use a minimum quantity of 2 items if that option is available for the discount type.

Check customer eligibility, usage limits, active dates, and discount combinations.

Save the discount.

Then go to the Shopify theme editor and paste the same code into the section setting called:

`Offer discount code`

## Best practice

The Buy 2 button should usually add quantity 2 to cart.

The discount code should be configured in Shopify so it only works when the cart qualifies for the offer.

This prevents customers from getting the offer discount when they only add one item.

## Testing checklist

Test the normal option.

Test the offer option.

Confirm the cart quantity is correct.

Confirm the discount appears when the cart qualifies.

Confirm the discount does not apply when the cart does not qualify.

Test on desktop and mobile.

Test in an unpublished draft theme before using the section on a live theme.
