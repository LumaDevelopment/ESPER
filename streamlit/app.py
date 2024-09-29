import streamlit as st
from snowflake.snowpark.context import get_active_session
import pandas as pd
import datetime


# Get the current Snowflake session
session = get_active_session()


# Function to display search results
def results(df, row1, row2):
    if not df.empty:
        st.write("Search Results:")
        
        # Loop through the dataframe to display search results
        for index, row in df.iterrows():
            with st.expander(f"Title: {row[row1]}"):
                st.write(f"Description: {row[row2]}\n")
                
                # Store the UUID in session state and create a unique key for each button
                if st.button(f"View Data", key=f"view_{index}"):
                    st.session_state.selected_uuid = row['UUID']
                    st.session_state.query_clicked = True
                    fetch_video_data(st.session_state.selected_uuid)
    else:
        st.write("No results found.")


# Function to execute the query and fetch video data
def fetch_video_data(uuid):
    query = f"""
    SELECT * FROM ESPE.ESPE_SCHEMA.ESPE_CONTRAST
    WHERE VIDEOUUID = '{uuid}';
    """
    result = session.sql(query).collect()
    c_df = pd.DataFrame(result)
    
    if not c_df.empty and 'IDX' in c_df.columns and 'VALUE' in c_df.columns:
        c_df['IDX'] = pd.to_numeric(c_df['IDX'], errors='coerce')
        c_df['VALUE'] = pd.to_numeric(c_df['VALUE'], errors='coerce')
        st.line_chart(data=c_df.set_index('IDX')['VALUE'], use_container_width=True)
    else:
        st.write("No data available for this video.")



# Main search bar functionality
st.title("Epileptic Seizure Prevention Extension (ESPE)")
st.write("""
    View data collected from the ESPE extension to analyze trends in seizure induction.
""")

# Search bar for video title/description
search_query = st.text_input(
    "Search by video title or description!",
    placeholder="Search..."
)

button_clicked = st.button("Search")

# Execute the search query
if button_clicked and search_query:
    # Split the search query into keywords
    keywords = search_query.split()
    
    # Construct SQL query for searching
    title_conditions = " OR ".join([f"TITLE ILIKE '%{keyword}%'" for keyword in keywords])
    description_conditions = " OR ".join([f"DESCRIPTION ILIKE '%{keyword}%'" for keyword in keywords])
    
    query = f"""
    SELECT * FROM ESPE.ESPE_SCHEMA.ESPE_VIDEOS
    WHERE {title_conditions} OR {description_conditions}
    LIMIT 10;
    """
    
    # Execute the query and fetch results
    result = session.sql(query).collect()
    result_df = pd.DataFrame(result) if result else pd.DataFrame()
    
    # Store search results in session state
    st.session_state.search_results = result_df

# Check if there are search results in the session state
if "search_results" in st.session_state and not st.session_state.search_results.empty:
    results(st.session_state.search_results, 'TITLE', 'DESCRIPTION')




############################################################################################

# Function to handle filtering via sidebar
def filter_query(col, val):
    query = f"""
        SELECT * FROM ESPE.ESPE_SCHEMA.ESPE_VIDEOS
        WHERE {col} = {val}
        LIMIT 10;
        """
        
    result = session.sql(query).collect()
    result_df = pd.DataFrame(result)
    return result_df

# Sidebar for filtering
st.sidebar.header("Select your filter")

# Frame Width Dropdown
frame_width = st.sidebar.selectbox(
    "Select a frame width",
    (None, 7680, 3840, 2560, 1920, 1280, 854, 640, 426),
)

# Frame Length Dropdown
frame_length = st.sidebar.selectbox(
    "Select a frame length",
    (None, 4320, 2160, 1440, 1080, 720, 480, 360, 240),
)

# Frame Rate Dropdown
frame_rate = st.sidebar.selectbox(
    "Select a frame rate",
    (None, 24, 30, 60)
)

# Category Dropdown
category = st.sidebar.selectbox(
    "Select a category",
    (None, "Autos & Vehicles", "Comedy", "Education", "Entertainment", "Film & Animation", 
     "Gaming", "Howto & Style", "Music", "News & Politics", "Nonprofits & Activism",
     "People & Blogs", "Pets & Animals", "Science & Technology", "Sports", "Travel & Events")
)

# Date calendar
selected_date = st.sidebar.date_input("Select an upload date", None)

if frame_width:
    result_df = filter_query("FRAMEWIDTH", frame_width)
    results(result_df, 'TITLE', 'DESCRIPTION')

if frame_length:
    result_df = filter_query("FRAMELENGTH", frame_length)
    results(result_df, 'TITLE', 'DESCRIPTION')

if frame_rate:
    result_df = filter_query("FRAMERATE", frame_rate)
    results(result_df, 'TITLE', 'DESCRIPTION')

if category:
    result_df = filter_query("CATEGORY", category)
    results(result_df, 'TITLE', 'DESCRIPTION')

if selected_date and (isinstance(selected_date, datetime.date)):
    snowflake_date_format = selected_date.strftime("'%Y-%m-%d'")
    result_df = filter_query("WHENUPLOADED", snowflake_date_format)
    results(result_df, 'TITLE', 'DESCRIPTION')
