import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Button from "@components/common/Button";

const RaiseQuerySchema = Yup.object().shape({
    subject: Yup.string().required("Subject is required"),
    description: Yup.string().required("Description is required"),
    category: Yup.string().required("Category is required"),
    priority: Yup.string().required("Priority is required"),
});

export const RaiseQuery = ({ onCancel, onSubmit }) => {
    const initialValues = {
        subject: "",
        description: "",
        category: "",
        priority: "Medium",
    };

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={RaiseQuerySchema}
            onSubmit={(values) => {
                onSubmit(values);
                onCancel();
            }}
        >
            <Form>
                <div className="form-group mb-3">
                    <label>Subject</label>
                    <Field name="subject" className="form-control" />
                    <ErrorMessage name="subject" className="error-text" component="div" />
                </div>

                <div className="form-group mb-3">
                    <label>Description</label>
                    <Field as="textarea" name="description" className="form-control" />
                    <ErrorMessage name="description" className="error-text" component="div" />
                </div>

                <div className="form-group mb-3">
                    <label>Category</label>
                    <Field as="select" name="category" className="form-select">
                        <option value="">Select</option>
                        <option value="income_tax">Income Tax</option>
                        <option value="salary">Salary Issue</option>
                        <option value="deductions">Deductions</option>
                        <option value="others">Others</option>
                    </Field>
                </div>

                <div className="form-group mb-3">
                    <label>Priority</label>
                    <Field as="select" name="priority" className="form-select">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </Field>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                    <Button variant="outline" label="Cancel" onClick={onCancel} />
                    <Button variant="solid" label="Submit" type="submit" />
                </div>
            </Form>
        </Formik>
    );
};
