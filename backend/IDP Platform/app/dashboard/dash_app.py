# import dash
# from dash import html, dcc

# dash_app = dash.Dash(
#     __name__,
#     requests_pathname_prefix="/dashboard/"
# )

# # dash_app.layout = html.Div(
# #     className="dashboard-container",
# #     children=[
# #         html.H2("Invoice Processing Dashboard"),

# #         dcc.Interval(id="refresh", interval=5000, n_intervals=0),

# #         # ⬇⬇ IDs MUST match callback ⬇⬇
# #         html.Div(id="kpis", className="kpi-row"),

# #         dcc.Graph(id="files-over-time"),
# #         dcc.Graph(id="status-donut"),
# #         dcc.Graph(id="folder-bar"),
# #         dcc.Graph(id="zip-bar"),
# #     ]
# # )


# from dash import html, dcc

# dash_app.layout = html.Div(
#     className="dashboard-container",
#     children=[

#         html.H2("Invoice Processing Dashboard"),

#         dcc.Location(id="url"),

#         # 🔷 KPI ROW
#         html.Div(id="kpis", className="kpi-row"),

#         # 🔷 MAIN CHART
#         html.Div(
#             className="card",
#             children=[
#                 html.H4("Files Processed Over Time"),
#                 dcc.Graph(id="files-over-time", config={"displayModeBar": False})
#             ]
#         ),

#         # 🔷 LOWER GRID
#         html.Div(
#             className="row",
#             children=[
#                 html.Div(
#                     className="card half",
#                     children=[
#                         html.H4("Processing Status"),
#                         dcc.Graph(id="status-donut", config={"displayModeBar": False})
#                     ]
#                 ),
#                 html.Div(
#                     className="card half",
#                     children=[
#                         html.H4("Folder Distribution"),
#                         dcc.Graph(id="folder-bar", config={"displayModeBar": False})
#                     ]
#                 ),
#             ]
#         ),

#         html.Div(
#             className="card",
#             children=[
#                 html.H4("ZIP-level Metrics"),
#                 dcc.Graph(id="zip-bar", config={"displayModeBar": False})
#             ]
#         )
#     ]
# )

# app/dashboard/dash_app.py
import dash
from dash import html, dcc

def create_dash_app():
    dash_app = dash.Dash(
        __name__,
        requests_pathname_prefix="/dashboard/"
    )

    dash_app.layout = html.Div(
        className="dashboard-container",
        children=[
            dcc.Location(id="url"),

            html.H2("Invoice Processing Dashboard"),

            html.Div(id="kpis", className="kpi-row"),

            html.Div(
                className="card",
                children=[
                    html.H4("Files Processed Over Time"),
                    dcc.Graph(id="files-over-time", style={"height": "280px"})
                ]
            ),

            html.Div(
                className="row",
                children=[
                    html.Div(
                        className="card half",
                        children=[
                            html.H4("Processing Status"),
                            dcc.Graph(id="status-donut", style={"height": "280px"})
                        ]
                    ),
                    html.Div(
                        className="card half",
                        children=[
                            html.H4("Folder Distribution"),
                            dcc.Graph(id="folder-bar", style={"height": "280px"})
                        ]
                    ),
                ]
            ),

            html.Div(
                className="card",
                children=[
                    html.H4("ZIP-level Metrics"),
                    dcc.Graph(id="zip-bar", style={"height": "280px"})
                ]
            )
        ]
    )

    return dash_app
