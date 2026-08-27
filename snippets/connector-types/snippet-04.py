class EmployeeConnector(BasePeopleConnector[EmployeeRecord]):
    configuration = CustomDatasourceConfig(name="hris", display_name="HRIS")

    def transform(self, data):
        return [to_employee(record) for record in data]
