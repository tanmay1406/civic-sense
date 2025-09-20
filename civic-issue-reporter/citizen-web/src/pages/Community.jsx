
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Card, CardContent, CardHeader, Avatar, Chip, Grid, CircularProgress, Alert } from "@mui/material";

const getLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => reject(error)
      );
    } else {
      reject(new Error("Geolocation not supported"));
    }
  });
};

const Community = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getLocation()
      .then((loc) => {
        return axios.get(`/api/issues/community?lat=${loc.lat}&lng=${loc.lng}&range=2`);
      })
      .then((res) => {
        setPosts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, px: 2 }}>
      <Typography variant="h4" gutterBottom align="center">Community Issues Near You (2km)</Typography>
      {posts.length === 0 ? (
        <Alert severity="info">No issues found in your area.</Alert>
      ) : (
        <Grid container spacing={3}>
          {posts.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={post._id}>
              <Card elevation={3} sx={{ height: "100%" }}>
                <CardHeader
                  avatar={<Avatar>{post.title?.[0] || "I"}</Avatar>}
                  title={post.title || "Untitled Issue"}
                  subheader={`Distance: ${post.distance?.toFixed(2)} km`}
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {post.description}
                  </Typography>
                  {post.category && (
                    <Chip label={post.category.name} color="primary" size="small" sx={{ mt: 1 }} />
                  )}
                  {post.priority && (
                    <Chip label={post.priority} color="secondary" size="small" sx={{ mt: 1, ml: 1 }} />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Community;
