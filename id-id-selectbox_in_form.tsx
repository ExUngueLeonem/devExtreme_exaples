import { FormEvent, useCallback, useEffect, useState } from "react";
import { Form, SelectBox } from "devextreme-react";
import { SimpleItem, ButtonItem, EmptyItem } from "devextreme-react/form";
import { FieldDataChangedEvent } from "devextreme/ui/form";
import notify from "devextreme/ui/notify";
import CustomStore from "devextreme/data/custom_store";
import ConnectionManager from "Services/ConnectionManager";
import Page from "Components/Page";

import "./config.scss";

interface IDiscount {
  [key: string]: any;
}

interface ICategory {
  [key: string]: any;
}

const categories = new CustomStore({
  loadMode: "raw",
  key: "id",
  load: (options) => ConnectionManager.Instance.client.get("/categories", { params: options }).then(({ data }) => data),
  byKey: (key) => ConnectionManager.Instance.client.get(`/categories/${key}`).then(({ data }) => data),
});

export default function Config() {
  const [model, setModel] = useState<{ [key: string]: any }>({
    allowedCategoryForPayment: [],
    attachGuestToOrder: false,
    categoryMappingForDiscount: {},
  });
  const [categoriesState, setCategoriesState] = useState<ICategory[]>([]);
  const [discountsState, setDiscountsState] = useState<IDiscount[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  const formUpdate = (e: FieldDataChangedEvent) => {
    if (e.dataField) {
      setModel((x) => ({ ...x, [e.dataField!]: e.value }));
    }
  };

  const save = (data: any) => {
    setIsLocked(true);
    ConnectionManager.Instance.client
      .post("/configurations", data)
      .then(() => notify("Успешно"))
      .catch(() => notify("Ошибка", "warning"))
      .finally(() => setIsLocked(false));
  };

  const onFormSubmitted = useCallback(
    (e: FormEvent) => {
      console.log("submitted");
      save(model);
      e.preventDefault();
    },
    [model]
  );

  useEffect(() => {
    setIsLocked(true);
    Promise.all([
      ConnectionManager.Instance.client.get("/configurations"),
      ConnectionManager.Instance.client.get("/categories"),
      ConnectionManager.Instance.client.get("/discounts"),
    ])
      .then(([a, b, c]) => {
        setModel(a.data);
        setCategoriesState(b.data);
        setDiscountsState(c.data);
      })
      .catch(() => notify("Ошибка", "warning"))
      .finally(() => setIsLocked(false));
  }, []);

  return (
    <Page title="Настройки">
      <form onSubmit={onFormSubmitted}>
        <Form disabled={isLocked} colCount={2} labelMode="floating" onFieldDataChanged={formUpdate} formData={model}>
          {/*закомментирую рабочий код, который не относится к примеру*/}
          {/*<SimpleItem*/}
          {/*  dataField={"allowedCategoryForPayment"}*/}
          {/*  editorType={"dxTagBox"}*/}
          {/*  editorOptions={{ dataSource: categories, displayExpr: "name", valueExpr: "id" }}*/}
          {/*  helpText={"Категории гостей для которых доступна оплата"}*/}
          {/*/>*/}
          {/*<SimpleItem*/}
          {/*  label={{ location: "top" }}*/}
          {/*  dataField={"attachGuestToOrder"}*/}
          {/*  editorType={"dxSwitch"}*/}
          {/*  editorOptions={{ dataSource: categories, displayExpr: "name", valueExpr: "id" }}*/}
          {/*  helpText={"Привязывать гостя к заказу в момент оплаты"}*/}
          {/*/>*/}




          {/*Вот он, наш компонент, ради которого этот пример*/}
          <SimpleItem
            label={{ location: "top", text: "Назначения скидок", visible: true }}
            dataField={"categoryMappingForDiscount"}
            render={(data) => {
              const valueChanged = (categoryId: string) => (e: any) => {
                data.component.updateData(data.dataField, { ...data.editorOptions.value, [categoryId]: e.value });
              }

              console.log("SimpleItem", data)
              return (
                <>
                  {categoriesState
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((category) => (
                      <SelectBox
                        key={`sb_${category.id}`}
                        labelMode="floating"
                        onValueChanged={valueChanged(category.id)}
                        text="Скидка не назначена"
                        label={category.name}
                        items={discountsState}
                        value={data.editorOptions.value[category.id]}
                        displayExpr="name"
                        valueExpr="id"
                        showClearButton
                      />
                    ))}
                </>
              );
            }}
          />




          <EmptyItem />
          <ButtonItem
            colSpan={2}
            buttonOptions={{
              text: "Сохранить",
              useSubmitBehavior: true,
            }}
          />
        </Form>
      </form>
    </Page>
  );
}
