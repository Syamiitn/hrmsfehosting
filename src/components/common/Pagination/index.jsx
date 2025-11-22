import React from "react";
import ReactPaginate from "react-paginate";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import "./index.css";

export default function Pagination({
    pageCount,
    onPageChange,
    currentPage
}) {
    return (
        <ReactPaginate
            previousLabel={<FaArrowLeft className="icon" />}
            nextLabel={<FaArrowRight className="icon" />}
            pageCount={pageCount}
            forcePage={currentPage}
            onPageChange={({ selected }) => onPageChange(selected)}
            containerClassName={"pagination"}
            pageClassName={"page-item"}
            pageLinkClassName={"page-link"}
            activeClassName={"active"}
            disabledClassName={"disabled"}
        />
    );
}
