# app/dashboard/callbacks.py
import requests
import pandas as pd
from dash import Input, Output, html
import plotly.express as px

def register_callbacks(dash_app):

    API_URL = "http://localhost:8000/api/metrics/"

    @dash_app.callback(
        Output("kpis", "children"),
        Output("files-over-time", "figure"),
        Output("status-donut", "figure"),
        Output("folder-bar", "figure"),
        Output("zip-bar", "figure"),
        Input("url", "pathname")   # fires once
    )
    def update_dashboard(_):

        print("🔥 DASH CALLBACK FIRED")  # DEBUG CONFIRMATION

        data = requests.get(API_URL).json()
        k = data["kpis"]

        kpis = [
            html.Div([html.Span("Total Files"), html.H2(k["total"])], className="kpi-card"),
            html.Div([html.Span("Success"), html.H2(k["success"])], className="kpi-card"),
            html.Div([html.Span("Failed"), html.H2(k["failed"])], className="kpi-card"),
            html.Div([html.Span("Avg Pages"), html.H2(round(k["avg_pages"], 2))], className="kpi-card"),
        ]

        ts_fig = px.bar(
            pd.DataFrame(data["timeseries"]),
            x="date", y="count"
        ).update_layout(uirevision="static", transition_duration=0)

        donut = px.pie(
            pd.DataFrame(data["status"].items(), columns=["status", "count"]),
            names="status", values="count", hole=0.55
        ).update_layout(uirevision="static", transition_duration=0)

        folder_fig = px.bar(
            pd.DataFrame(data["folders"].items(), columns=["folder", "count"]),
            x="count", y="folder", orientation="h"
        ).update_layout(uirevision="static", transition_duration=0)

        zip_fig = px.bar(
            pd.DataFrame(data["zips"].items(), columns=["zip", "count"]),
            x="zip", y="count"
        ).update_layout(uirevision="static", transition_duration=0)

        return kpis, ts_fig, donut, folder_fig, zip_fig
