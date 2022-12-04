
## Data Description

__1. Global Temperature Anomaly__

[Like to Global Temperature Anomaly Data](https://data.giss.nasa.gov/gistemp/graphs/graph_data/Global_Mean_Estimates_based_on_Land_and_Ocean_Data/graph.txt)

This dataset contains global temperature anomaly data from 1880 to 2021. We only used the data from 1950 to 2021 in our visualizations.

Data Fields:

- Year: Numerical year from 1880 to 2021.
- No_Smoothing: Floating point numerical data not smoothed
- Lowess: Floating point numerical data smoothed using Lowess

__2. NCEI Storm Events Database__

Severe weather reports from 1950-2022 in the US
Source: [https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/](https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/)

This dataset contains over 1.7 million rows of data for ~70 unique storm events that occurred in US states between 1950 and 2022.
In order to make this project more meaningful we decided to focus on the top 8 storm events by total count.  The top 8 storm events
are listed below and we included these in our main dashboard visualizations.

- Extreme Temperature
- Flood
- Hurricane
- Landslide
- Thunderstorm
- Tornado
- Wildfire
- Winter Storm

In addition, the dataset also included the following storm event statistics which we used in our dashboard visualizations.

- Deaths: Number of deaths directly related to a storm event.
- Property Damage:  Damage cost in US dollars of a particular storm event.


