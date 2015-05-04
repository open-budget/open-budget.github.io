# @fixme: move to Angular's defaults
#
class Settings
    @margin =
        top:    350
        right:  500
        bottom: 350
        left:   500

    @radius = Math.min(@.margin.top, @.margin.bottom, @.margin.right, @.margin.left) - 10

    @url = "http://api.open-budget.org/v1/expenses.json?area_id=0&year=2014"

    @byDefault =
        0: [
            "0110000",
            "0300000",
            "0410000",
            "0500000",
            "0600000",
            "0650000",
            "0700000",
            "0750000",
            "0800000",
            "0900000",
            "3100000"
        ]