data =
    parent:
        parent:
            parent:
                parent: {}

describe "Helpers", ->
    describe "level", ->
        it "should count parents for a current node", ->
            expect(Helpers.level data).toEqual 4

        it "should return 0 if no parents detected", ->
            expect(Helpers.level {}).toEqual 0