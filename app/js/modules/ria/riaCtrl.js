'use strict';

define([
    'app',
    "common/comp/commonChart",
    "lib/harViewer/harPreview",
    "common/comp/datatable"
], function (app, commonChart, HarPreview) {
    var riaCtrl = function ($scope, $http, $routeParams) {
        $scope.time = new Date().getTime();
        var types = [
            {
                name: '时间', 
                uri: '/ria/getTiming', 
                types: [
                    'timeToFirstResFirstByte',
                    'timeTofirstScreenFinished',
                    'onDOMReadyTime',
                    'windowOnLoadTime',
                    'httpTrafficCompleted',
                    'timeFrontendRate',
                    'timeToFirstCss',
                    'timeToFirstJs',
                    'slowestResponse'
                ]
            },
            {
                name: '文件与内容', 
                uri: '/ria/getOther', 
                types: [
                    'cssSize',
                    'cssCount',
                    'jsSize',
                    'jsCount',
                    'imageSize',
                    'imageCount',
                    'consoleMessages'
                ]
            },
            {
                name: '请求', 
                uri: '/ria/getOther', 
                types: [
                    'requests',
                    'notFound',
                    'ajaxRequests',
                    'maxRequestsPerDomain',
                    'medianRequestsPerDomain'
                ]
            },
            {
                name: 'DOM', 
                uri: '/ria/getOther', 
                types: [
                    'DOMqueries',
                    'DOMqueriesById',
                    'DOMqueriesByClassName',
                    'DOMqueriesByTagName',
                    'DOMqueriesByQuerySelectorAll',
                    'DOMinserts',
                    'DOMqueriesDuplicated',
                    'DOMelementsCount',
                    'DOMelementMaxDepth',
                    'nodesWithInlineCSS'
                ]
            }
        ];

        var stackCharts = ['timeFrontendRate'];
        var stackChartsLabel = [['后端', '前端']];
        var stackChartsDataProcess = [function(data) {
            var result = [];
            for (var i in data) {
                result.push({
                    x: data[i].x,
                    y: [100 - Number(data[i].y[0]), Number(data[i].y[0])]
                })
            }
            return result;
        }];

        $scope.changeMode = function() {
            $scope.pageUrl = null;
            $scope.pageType = null;
            $(".box.span6").css('display','none');
        };

        $scope.changeStat = function() {
            if (!$scope.stat) {
                $(".box-content").css('display','none');
                return;
            }
            $(".box-content").css('display','none');
            $http.get('/ria/getSummary?cnt=' + $scope.stat.cnt).
                success(function(json, status, headers, config) {
                    if (json.code != 100000) {
                        alert("服务器内部错误!");
                    }
                    $scope.sums = json.data;
                    $(".box-content").css('display','');
                });
        };

        $scope.changeUrl = function() {
            if (!$scope.types) {
                $scope.types = types;
            }
            if ($scope.pageUrl) {
                $scope.pageType = types[0];
                $scope.changeType();
            }
            else {
                $scope.pageType = null;
                $(".box.span6").css('display','none');
            }
        };

        $scope.getDetail = function(url) {
            $scope.model = $scope.models[1];
            $scope.changeMode();

            for(var i in $scope.urls) {
                if ($scope.urls[i].addr === url) {
                    $scope.pageUrl = $scope.urls[i];
                    break;
                }
            }
            $scope.changeUrl();
        };

        var harView = null;

        var showWaterFall = function(index, time) {
            if ($scope.harLocker) {
                return;
            }
            $scope.harLocker = true;
            var URL = 'http://172.16.142.32:3000/ria/getHar?index=' + index + '&time=' + time;
            $('#waterfall')[0].innerHTML = '';

            var settings = {
                jsonp: true
            }
            if (!harView) {
                var content = document.getElementById("harViewer");
                var harView = content.repObject = new HarPreview();
                var fn = function() {
                    harView.setRenderNode({
                        stats: $("#stats")[0],
                        waterfall: $("#waterfall")[0]
                    })
                }
                harView.initialize(content, fn);

                $("#harViewer").bind("onPreviewHARLoaded", function(event) {
                    $scope.harLocker = false;
                    $("#harViewer").css('display', '');
                    $(".box.span6").css('display','none');
                    $("#stats")[0].style.display = 'none';
                });
            }
            harView.loadHar(URL, settings);
        };

        var render = function (index, stack, flag) {
            return function(json) {
                if (json.code != 100000) {
                    $(".box.span6").css('display','none');
                    return;
                }
                if (json.data.data.length === 0) {
                    $(".box.span6").css('display','none');
                    return;
                }
                if (stack !== -1) {
                    commonChart({
                        click: flag ? function(e) {
                            showWaterFall($scope.pageUrl._id, new Date(e.dataPoint.x).getTime());
                        } : null,
                        type: 'stackedArea100',
                        container: "chart" + index,
                        labels: stackChartsLabel[stack],
                        data: stackChartsDataProcess[stack](json.data.data)
                    }, {
                        // title: {text: ''},
                        toolTip: {
                            content: function(e){
                                var date = new Date(e.entries[0].dataPoint.x);
                                if (flag) {
                                    return '<i style="color:' + e.entries[0].dataSeries.color + ';">' + (date.getMonth() + 1) + '月' + date.getDate() + '日' + date.getHours() + '时:</i> <strong>' + e.entries[0].dataPoint.y + "%</strong>";
                                }
                                
                                return '<i style="color:' + e.entries[0].dataSeries.color + ';">' + (date.getMonth() + 1) + '月' + date.getDate() + '日:</i> <strong>' + e.entries[0].dataPoint.y + "</strong>";
                            }
                        },
                        axisX: {  
                                labelAngle: 150,   
                                interval:1, 
                                intervalType: "day",
                                valueFormatString: "M.D"
                        },
                        axisY: {
                            suffix: "%",
                            minimum: 0,
                            maximum: 100
                        },
                        data: []
                    });
                    return;
                }
                commonChart({
                    click: flag ? function(e) {
                        showWaterFall($scope.pageUrl._id, new Date(e.dataPoint.x).getTime());
                    } : null,
                    'type' : 'line',
                    'container' : "chart" + index,
                    'labels' : json.data.label,
                    'data' : json.data.data
                }, {
                    toolTip: {
                        content: function(e){
                            var date = new Date(e.entries[0].dataPoint.x);
                            if (flag) {
                                return '<i style="color:' + e.entries[0].dataSeries.color + ';">' + (date.getMonth() + 1) + '月' + date.getDate() + '日' + date.getHours() + '时:</i> <strong>' + Number(e.entries[0].dataPoint.y).toFixed(2) + (name==="时间"?"ms":"") + "</strong>";
                            }
                            return '<i style="color:' + e.entries[0].dataSeries.color + ';">' + (date.getMonth() + 1) + '月' + date.getDate() + '日:</i> <strong>' + e.entries[0].dataPoint.y + "</strong>";
                        }
                    },
                    axisX: {
                        labelAngle: 150, 
                        intervalType: "hour",
                        valueFormatString: "M.D"
                    },
                    axisY: {suffix: flag ? "ms" : "", minimum: 0},
                    data: []
                });
            }
        };
            
        $scope.changeType = function(cnt) {
            if (!$scope.pageType) {
                $(".box.span6").css('display','none');
                return;
            }
            var flag = false;
            if ($scope.pageType.name === "时间") {
                flag = true;
            }
            $("#harViewer").css('display','none');
            $(".box.span6").css('display','');
            var prefix = $scope.pageType.uri + '?index=' + $scope.pageUrl._id + '&to=' + $scope.time +'&from=' + ($scope.time - (cnt?cnt:30) * 24 * 3600000) + '&type=';
            var i = 0;
            for (; i < $scope.pageType.types.length; i++) {
                $('.box.span6 .box-content')[i].style.display = '';
                $(".box h2")[i + 3].innerHTML = '<i class="icon-edit"></i> ' + $scope.pageType.types[i];

                var index = stackCharts.indexOf($scope.pageType.types[i]);
                $http.get(prefix + $scope.pageType.types[i]).success(render(i, index, flag));
            }

            for (; i < $('.box.span6').length; i++) {
                $('.box.span6')[i].style.display = 'none';
            }
        };

        /************************** init**************************/
        $http.get('/configure/getUrl').
            success(function(json, status, headers, config) {
                if (json.code != 100000) {
                    alert("服务器内部错误!");
                }
                $scope.urls = json.data;
            });
        $scope.models = [
            {name: '数据概况', type: 1},
            {name: '详细统计', type: 2}
        ];
        $scope.model = $scope.models[0];
        $scope.stats = [
            {name: '每日', cnt: 1},
            {name: '每周', cnt: 7},
            {name: '每月', cnt: 30}
        ];
        $scope.stat = $scope.stats[1];
        $scope.changeStat();
        /************************** init end **********************/
    };
    app.register.controller('riaCtrl', ['$scope', '$http', '$routeParams', riaCtrl]);
});
