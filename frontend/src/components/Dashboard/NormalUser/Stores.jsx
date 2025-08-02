import { ArrowDownUp, CheckIcon, Star } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import Modal from 'react-bootstrap/Modal';
import storeImage1 from '../../../images/store.png'
import { getStores, rateStore } from '../../../APIs';
import { toast } from 'react-toastify';
import Pagination from 'react-bootstrap/Pagination';
import { Spinner } from 'react-bootstrap';

const Stores = () => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // console.log('loggedInUser: ', loggedInUser);
    const [show, setShow] = useState(false);
    const [editing, setEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [storeData, setStoreData] = useState({ data: [], loading: true });
    const [userRating, setUserRating] = useState(0);

    const [selectedStore, setSelectedStore] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [sortDir, setSortDir] = useState(null);
    const [sortField, setSortField] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleClose = () => {
        if (editing) {
            setUserRating(selectedStore ? selectedStore.overall_rating : 0);
            setEditing(false);
        }
        setShow(false)
    };
    const handleShow = (store) => {
        setShow(true);
        setSelectedStore(store);
    };
    useEffect(() => {
        fetch_stores(currentPage);
    }, [currentPage, searchTerm, sortField, sortDir])
    async function fetch_stores(page = currentPage) {
        const payload = {
            enteriesPerPage: 10,
            currentPage: page,
            ...(searchTerm && { searchTerm }),
            ...(sortField && sortDir && { [sortField]: sortDir })
        }

        try {
            const response = await getStores(payload);
            console.log('response: ', response);
            const totalPages = Math.ceil(response?.data?.totalStores / 10)
            setTotal(totalPages)
            const required_data = response?.data?.data?.map(store => {
                const ratings = store.rating_details;

                const totalRatings = ratings.length;
                const overallRating = totalRatings > 0
                    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings)
                    : null;

                const myRatingObj = ratings.find(r => r.user_id === loggedInUser.user_id);
                const myRating = myRatingObj ? myRatingObj.rating : null;

                return {
                    name: store.name,
                    email: store.email,
                    store_id: store.store_id,
                    address: store.address,
                    overall_rating: overallRating,
                    my_rating: myRating
                };
            });

            console.log(required_data);

            setStoreData({ data: required_data, loading: false })
            console.log('response?.data?.data: ', response?.data?.data);

        } catch (error) {
            console.log('error: ', error);

        }
    }
    const handleSubmitRating = async () => {
        setEditing(false);
        setIsLoading(true);
        const payload = {
            store_id: selectedStore?.store_id,
            user_id: loggedInUser?.user_id,
            rating: userRating
        }
        try {
            const response = await rateStore(payload);
            console.log('response: ', response);
            toast.success("Thank you for rating us.", {
                autoClose: 2000,
                position: 'top-right'
            })
            fetch_stores();
            setShow(false);
            setIsLoading(false);

        } catch (error) {
            toast.error(error?.response?.data?.error || "Failed to give rating", {
                autoClose: 2000,
                position: 'top-right'
            })
            console.log('error: ', error);
            setShow(false);
            setIsLoading(false);

        }

    }
    const handleSort = (field) => {
        const direction =
            sortField === field && sortDir === 'ASC' ? 'DESC' : 'ASC';

        setSortField(field);
        setSortDir(direction);
    };
    return (
        <div className='container mt-2'>
            <div className='d-flex flex-column flex-md-row  justify-content-between'>
                <h4>List of Stores</h4>
                <input
                    type="text"
                    className='form-control mb-3'
                    placeholder='Search Stores or address'
                    style={{ maxWidth: '400px' }}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />

            </div>
            <div className='table-responsive'>
                <table className="table  table-bordered">
                    <thead>
                        <tr className='text-center'>
                            <th scope="col">Sr.No</th>
                            <th scope="col">
                                <div style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                                    Store Name <ArrowDownUp size={18} />
                                </div>                            </th>
                            <th scope="col">
                                <div style={{ cursor: 'pointer' }} onClick={() => handleSort('address')}>
                                    Address <ArrowDownUp size={18} />
                                </div>
                            </th>
                            <th scope="col">Overall Rating </th>
                            <th scope="col">My Rating </th>
                            <th scope="col">Action </th>
                        </tr>
                    </thead>
                    <tbody>
                        {storeData?.loading ? (
                            <tr className='text-center'>
                                <td colSpan={5}><Spinner /></td>
                            </tr>

                        ) :
                            storeData.data.length === 0 ?
                                <tr>
                                    <td colSpan="6" className="text-center fw-bold text-danger">No Stores Found</td>
                                </tr> :
                                storeData.data.map((store, ind) =>
                                    <tr key={ind}>
                                        <th scope="row" className='text-center'>{(currentPage - 1) * 10 + ind + 1}</th>
                                        <td>{store.name}</td>
                                        <td>{store.address}</td>
                                        <td className='text-center'>
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Star
                                                    key={i}
                                                    color={i <= Math.round(store?.overall_rating) ? '#ffd700' : '#ddd'}
                                                    fill={i <= Math.round(store?.overall_rating) ? '#ffd700' : '#ddd'}
                                                />
                                            ))}
                                        </td>
                                        <td className='text-center'>
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Star
                                                    key={i}
                                                    color={i <= Math.round(store?.my_rating) ? '#ffd700' : '#ddd'}
                                                    fill={i <= Math.round(store?.my_rating) ? '#ffd700' : '#ddd'}
                                                />
                                            ))}
                                        </td>
                                        <td className='text-center'>
                                            <button type="button" className="btn round_button"
                                                onClick={() => handleShow(store)}
                                            >
                                                Rate this Store
                                            </button>
                                        </td>
                                    </tr>
                                )
                        }
                    </tbody>
                </table>
            </div>
            <div className="d-flex justify-content-center">
                <Pagination>
                    <Pagination.Prev
                        disabled={currentPage === 1 || storeData.data.length === 0}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    />

                    {Array.from({ length: total }, (_, i) => (
                        <Pagination.Item
                            key={i + 1}
                            active={i + 1 === currentPage}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </Pagination.Item>
                    ))}

                    <Pagination.Next
                        disabled={currentPage === total || storeData.data.length === 0}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, total))}
                    />
                </Pagination>
            </div>
            <Modal
                show={show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title>{selectedStore && selectedStore.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div class="card p-2" >
                        {selectedStore &&
                            <>
                                <div className='p-2'>
                                    <img src={storeImage1} class="card-img-top" alt="..." />
                                </div>
                                <div class="card-body py-0">
                                    <h4 class="card-title text-center mb-0 mt-0">{selectedStore.name}</h4>
                                    <p className='text-center text-secondary mt-0'>{selectedStore.owner}</p>
                                    {console.log('selectedStore: ', selectedStore)}
                                    <p className='fw-bold mb-0'>Address</p>
                                    <p className='mb-0'>{selectedStore.address}</p>
                                    <p className='fw-bold mb-0'>Overall Rating</p>
                                    <p className='mb-0'>
                                        {/* Rating  */}
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star
                                                key={i}
                                                color={i <= Math.round(selectedStore?.overall_rating) ? '#ffd700' : '#ddd'}
                                                fill={i <= Math.round(selectedStore?.overall_rating) ? '#ffd700' : '#ddd'}
                                            />
                                        ))}

                                    </p>
                                    <p className='fw-bold my-0'>Your Rating</p>
                                    <p className=''>
                                        {[1, 2, 3, 4, 5].map(i => {
                                            const activeRating = editing ? userRating : selectedStore?.my_rating;
                                            return (
                                                <Star
                                                    key={i}
                                                    color={i <= activeRating ? '#ffd700' : '#ddd'}
                                                    fill={i <= activeRating ? '#ffd700' : '#ddd'}
                                                    onClick={() => {
                                                        if (editing) {
                                                            setUserRating(i);
                                                            console.log(`Rated ${i} stars`);
                                                        }
                                                    }}
                                                    style={{ cursor: editing ? 'pointer' : 'default' }}
                                                />
                                            );
                                        })}

                                        {!editing && (
                                            <button type="button" className="btn edit_button btn-sm" onClick={() => {
                                                setUserRating(selectedStore?.my_rating ?? 0);
                                                setEditing(true);
                                            }}>
                                                Edit
                                            </button>
                                        )}

                                        {editing && (
                                            <>
                                                <button type="button" className="btn cancel_button btn-sm mx-2" onClick={() => {
                                                    setUserRating(selectedStore?.my_rating ?? 0); // reset on cancel
                                                    setEditing(false);
                                                }}>
                                                    Cancel
                                                </button>
                                                <button type="button" className="btn done_button btn-sm" disabled={isLoading} onClick={handleSubmitRating}>
                                                    Done <CheckIcon />
                                                    {isLoading && <Spinner size='sm' className='mx-2' />}
                                                </button>
                                            </>
                                        )}
                                    </p>

                                </div>

                            </>
                        }

                    </div>
                </Modal.Body>
            </Modal>
        </div >
    )
}

export default Stores