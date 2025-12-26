import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function TicketList({ user }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tickets');
      setTickets(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch tickets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      await axios.put(`/api/tickets/${ticketId}`, { status: newStatus });
      fetchTickets();
    } catch (err) {
      setError('Failed to update ticket');
    }
  };

  const deleteTicket = async (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        await axios.delete(`/api/tickets/${ticketId}`);
        fetchTickets();
      } catch (err) {
        setError('Failed to delete ticket');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-warning',
      in_progress: 'bg-info',
      resolved: 'bg-success',
      closed: 'bg-secondary'
    };
    return badges[status] || 'bg-secondary';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-danger',
      medium: 'bg-warning',
      low: 'bg-success'
    };
    return badges[priority] || 'bg-secondary';
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Tickets</h2>
        <Link to="/create-ticket" className="btn btn-primary">
          <i className="fas fa-plus me-2"></i>
          Create New Ticket
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex gap-2">
            <button
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`btn ${filter === 'open' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('open')}
            >
              Open
            </button>
            <button
              className={`btn ${filter === 'in_progress' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('in_progress')}
            >
              In Progress
            </button>
            <button
              className={`btn ${filter === 'resolved' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('resolved')}
            >
              Resolved
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        {filteredTickets.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info">
              No tickets found. Create your first ticket!
            </div>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div className="col-md-6 mb-3" key={ticket.id}>
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0">{ticket.title}</h5>
                    <div>
                      <span className={`badge ${getStatusBadge(ticket.status)} me-1`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`badge ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                  
                  <p className="card-text">{ticket.description}</p>
                  
                  <div className="mb-3">
                    <small className="text-muted">
                      <i className="fas fa-user me-1"></i>
                      Created by: {ticket.created_by}
                    </small>
                    <br />
                    <small className="text-muted">
                      <i className="fas fa-calendar me-1"></i>
                      Created: {ticket.created_at}
                    </small>
                  </div>

                  <div className="d-flex justify-content-between">
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                        disabled={ticket.status === 'in_progress'}
                      >
                        <i className="fas fa-play me-1"></i>
                        Start
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                        disabled={ticket.status === 'resolved'}
                      >
                        <i className="fas fa-check me-1"></i>
                        Resolve
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => updateTicketStatus(ticket.id, 'closed')}
                        disabled={ticket.status === 'closed'}
                      >
                        <i className="fas fa-times me-1"></i>
                        Close
                      </button>
                    </div>
                    
                    {user.role === 'admin' && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteTicket(ticket.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TicketList;