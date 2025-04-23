
modal_structure = {
    "headline": "string", # e.g. "Top Picks for You"
    "subheadline": "string", # e.g. "Based on your recent search for shoes"
    "items": [ # List of product items
        {
                "id": "string",
                "name": "string",
                "category": "string",
                "pricing": {
                    "original": "number",
                    "current": "number",
                    "currency": "string",
                    "savings": {
                        "amount": "number",
                        "percentage": "number"
                    }
                },
            "relevanceScore": "number",  # 0-100
            "relevanceReason": "string",  # e.g. "Based on your recent search for shoes"
            "image": "string",
            "viewed": "boolean",  # true/false. if user has viewed the product item
            "link": "string"  # "conversion link"
        }
    ],
    "assistant": {
        "type": "string",  # e.g., "Product Expert", "Fashion Advisor", etc. Maximum 20 characters
        "expertise": "string", # e.g., "Fashion", "Electronics", etc. Maximum 20 characters
        "initialMessage": "string",  # an initial and personilised message. 
    },
    "actions": {
        "primary": {
            "type": "string",  # like add_to_cart, view_details, etc.
            "label": "string",  # Contextual CTA. Maximum 16 characters
            "style": "primary"
        }
    }
}
