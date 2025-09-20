import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './EditAuction.css';
import axios from 'axios';

const EditAuction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    startTime: '',
    endTime: '',
    startingPrice: '',
    currency: '',
    images: [],
    video: ''
  });
  const [mediaPreview, setMediaPreview] = useState([]);
  const [canEdit, setCanEdit] = useState(false);

  const handleFileChange = e => {
    setForm(prev => ({ ...prev, images: Array.from(e.target.files) }));
    setMediaPreview(Array.from(e.target.files).map(file => URL.createObjectURL(file)));
  };

  useEffect(() => {
    const fetchAuction = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching auction with ID:', id);
        const res = await api.get(`/auctions/${id}`);
        console.log('=== AUCTION DATA RECEIVED ===');
        console.log('Raw auction data:', res.data);
        console.log('startDate from backend:', res.data.startDate);
        console.log('endDate from backend:', res.data.endDate);
        console.log('startTime from backend:', res.data.startTime);
        console.log('endTime from backend:', res.data.endTime);
        
        // Convert UTC dates from backend to local datetime-local format
        // For datetime-local input, we need YYYY-MM-DDTHH:MM in local timezone
        
        const startDateObj = new Date(res.data.startDate);
        const endDateObj = new Date(res.data.endDate);
        
        // Simple approach: format as local time for datetime-local input
        const formatForDatetimeLocal = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };
        
        const startTimeForForm = formatForDatetimeLocal(startDateObj);
        const endTimeForForm = formatForDatetimeLocal(endDateObj);
        
        console.log('Date conversion details:', {
          'Backend startDate (UTC)': res.data.startDate,
          'Backend endDate (UTC)': res.data.endDate,
          'Local Date Objects': { startDateObj, endDateObj },
          'Form values (local time)': { startTimeForForm, endTimeForForm }
        });
        
        setAuction(res.data);
        setForm({
          title: res.data.title,
          category: res.data.category,
          description: res.data.description,
          startTime: startTimeForForm,
          endTime: endTimeForForm,
          startingPrice: res.data.startingPrice,
          currency: res.data.currency,
          images: res.data.images || [],
          video: res.data.video || ''
        });
        setMediaPreview(res.data.images || []);
        setCanEdit(res.data.status === 'upcoming');
      } catch (err) {
        setError('Failed to load auction');
      } finally {
        setLoading(false);
      }
    };
    fetchAuction();
  }, [id]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      console.log('=== FORM SUBMISSION DEBUG ===');
      console.log('Original form data:', form);
      console.log('Start time from form:', form.startTime);
      console.log('End time from form:', form.endTime);
      
      // Debug the date conversion
      const startTimeDate = new Date(form.startTime);
      const endTimeDate = new Date(form.endTime);
      console.log('Converted start time:', startTimeDate.toISOString());
      console.log('Converted end time:', endTimeDate.toISOString());
      console.log('Local timezone offset:', new Date().getTimezoneOffset());
      
      const formData = new FormData();
      
      // Map frontend fields to backend expected fields with proper timezone handling
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'images') {
          value.forEach(img => formData.append('images', img));
        } else if (key === 'startTime') {
          console.log('Processing startTime:', value);
          // Handle timezone correctly like CreateAuction does
          // The input gives us local time in format "YYYY-MM-DDTHH:MM"
          const localDateTime = value; // e.g., "2025-09-19T15:30"
          
          // Parse the local datetime string manually to avoid timezone issues
          const [datePart, timePart] = localDateTime.split('T');
          const [year, month, day] = datePart.split('-');
          const [hours, minutes] = timePart.split(':');
          
          // Create date object in local timezone
          const localDate = new Date(year, month - 1, day, hours, minutes);
          
          // Send as ISO string but adjusted for local timezone
          formData.append('startTime', localDate.toISOString());
          console.log(`startTime: Input=${localDateTime}, LocalDate=${localDate.toString()}, ISO=${localDate.toISOString()}`);
        } else if (key === 'endTime') {
          console.log('Processing endTime:', value);
          // Handle timezone correctly like CreateAuction does
          const localDateTime = value;
          
          const [datePart, timePart] = localDateTime.split('T');
          const [year, month, day] = datePart.split('-');
          const [hours, minutes] = timePart.split(':');
          
          const localDate = new Date(year, month - 1, day, hours, minutes);
          
          formData.append('endTime', localDate.toISOString());
          console.log(`endTime: Input=${localDateTime}, LocalDate=${localDate.toString()}, ISO=${localDate.toISOString()}`);
        } else {
          formData.append(key, value);
        }
      });
      
      // Debug what's being sent
      for (let [key, value] of formData.entries()) {
        console.log(`FormData ${key}:`, value);
      }
      
      console.log('Sending update request...');
      const response = await api.put(`/auctions/${id}`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data' 
        }
      });
      console.log('Update response:', response.data);
      
      // Set a flag in localStorage to indicate data needs refresh
      localStorage.setItem('auctionDataNeedsRefresh', 'true');
      localStorage.setItem('lastAuctionUpdate', Date.now().toString());
      
      // Trigger a custom event to refresh home page data
      window.dispatchEvent(new CustomEvent('auctionUpdated', { 
        detail: { auctionId: id, timestamp: Date.now() }
      }));
      
      // Force a complete refresh of the app state
      window.location.href = '/my-auctions';
    } catch (err) {
      console.error('Update error:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to update auction: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this auction? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/auctions/${id}`);
      navigate('/my-auctions');
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete auction: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!auction) return null;

  return (
    <div className="edit-auction-container">
      <h2>Edit Auction</h2>
      
      {/* Debug information */}
      <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0', fontSize: '12px' }}>
        <strong>Debug Info:</strong><br/>
        Current time: {new Date().toLocaleString()}<br/>
        Current time UTC: {new Date().toISOString()}<br/>
        Timezone offset: {new Date().getTimezoneOffset()} minutes<br/>
        {auction && (
          <>
            <hr style={{ margin: '5px 0' }}/>
            <strong>Backend Data:</strong><br/>
            Backend startDate (UTC): {auction.startDate}<br/>
            Backend endDate (UTC): {auction.endDate}<br/>
            <hr style={{ margin: '5px 0' }}/>
            <strong>Form Data:</strong><br/>
            Form startTime: {form.startTime}<br/>
            Form endTime: {form.endTime}<br/>
            <hr style={{ margin: '5px 0' }}/>
            <strong>Verification:</strong><br/>
            Form start as Date: {form.startTime ? new Date(form.startTime).toString() : 'N/A'}<br/>
            Form end as Date: {form.endTime ? new Date(form.endTime).toString() : 'N/A'}<br/>
          </>
        )}
      </div>
      
      {canEdit ? (
        <form onSubmit={handleSubmit} className="edit-auction-form">
          <label>Title</label>
          <input name="title" value={form.title} onChange={handleChange} required />
          <label>Category</label>
          <input name="category" value={form.category} onChange={handleChange} required />
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} required />
          <label>Start Time</label>
          <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} required />
          <label>End Time</label>
          <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} required />
          <label>Starting Price</label>
          <input type="number" name="startingPrice" value={form.startingPrice} onChange={handleChange} required />
          <label>Currency</label>
          <input name="currency" value={form.currency} onChange={handleChange} required />
          <label>Images</label>
          <input type="file" name="images" multiple onChange={handleFileChange} accept="image/*" />
          <div className="media-preview">
            {mediaPreview.map((src, idx) => (
              <img key={idx} src={src} alt="preview" style={{ width: 80, marginRight: 8 }} />
            ))}
          </div>
          <label>Video</label>
          <input name="video" value={form.video} onChange={handleChange} />
          <button type="submit">Update Auction</button>
          <button type="button" onClick={handleDelete} className="delete-btn">Delete Auction</button>
        </form>
      ) : auction.status === 'active' ? (
        <form onSubmit={async e => {
          e.preventDefault();
          try {
            await api.put(`/auctions/${id}/endtime`, { 
              endTime: form.endTime 
            });
            navigate('/my-auctions');
          } catch (err) {
            console.error('Update end time error:', err);
            setError('Failed to update end time: ' + (err.response?.data?.message || err.message));
          }
        }} className="edit-auction-form">
          <p>You can only modify the ending time for an active auction.</p>
          <label>End Time</label>
          <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} required />
          <button type="submit">Update End Time</button>
          <button type="button" onClick={handleDelete} className="delete-btn">Delete Auction</button>
        </form>
      ) : (
        <div>
          <p>This auction has ended. You cannot edit or delete it.</p>
        </div>
      )}
    </div>
  );
};

export default EditAuction;
