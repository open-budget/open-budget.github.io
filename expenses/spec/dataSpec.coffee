describe "Data", ->
    describe "hierarchy", ->
        it "should build correct hierarchy on State data (three-level hierarchy)", ->
            expect(Data.hierarchy(fixtures.state)).toEqual fixtures.stateResult

        it "should build correct hierarchy on data from Areas (two-level hierarchy)", ->
            expect(Data.hierarchy(fixtures.area)).toEqual fixtures.areaResult